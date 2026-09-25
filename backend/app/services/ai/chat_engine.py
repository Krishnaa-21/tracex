"""Chat assistant engine.

Flow: resolve scope (open case / named case(s) / all cases) -> build a grounded
context from the database -> the LLM reasons over that context and writes the answer.
The deterministic rules engine below is ONLY a fallback: it runs when no LLM is
configured or the LLM call fails (and the failure reason is reported, not hidden).
"""
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.db.models import Case, Entity
from app.services.ai import chat_context as ctx
from app.services.ai.chat_context import CaseData, clean, enum_val, pretty, risk_text
from app.services.ai.chat_llm import ask_llm, llm_configured
from app.services.ai.llm_client import LLMResult

logger = logging.getLogger("tracex.chat")

FALLBACK_NOTE = "\n\n*(AI service unavailable right now — answered directly from case data.)*"


@dataclass
class ChatResult:
    response: str
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    suggested: List[str] = field(default_factory=list)
    source: str = "rules"  # llm | rules (LLM not configured) | rules_fallback (LLM failed)
    llm_error: Optional[str] = None  # short error code when the LLM was configured but failed


def _has(q: str, pattern: str) -> bool:
    return re.search(pattern, q) is not None


def _more(n: int) -> str:
    return f" (+{n} more)" if n > 0 else ""


def _fmt_list(values: List[str], limit: int) -> str:
    shown = ", ".join(f"`{v}`" for v in values[:limit])
    return shown + _more(len(values) - limit)


# --------------------------------------------------------------------------- #
# Intent patterns (matched against the lower-cased question)
# --------------------------------------------------------------------------- #
CROSS_RE = r"cross|syndicate|other cases?|another case|overlap|shared?\b|sharing|reuse|same (?:account|upi|phone|number|entit)|common"
SUMMARY_RE = r"summar|overview|what happened|\bbrief\b|about (?:this|the) case|tell me about|case details?|narrative|explain (?:this |the )?case"
ACTION_RE = r"freeze|next steps?|\baction|notice|crpc|section 91|69a|takedown|legal|recommend|directive|what should|what do i do"
RISK_RE = r"risk|danger|threat|anomal|score|severity|critical|flag|suspicious"
SUSPECT_RE = r"suspect|mule|beneficiar|perpetrator|accused|fraudster|\bwho\b|involved|indicators?|entities|entity"
LINKS_RE = r"connection|relationship|graph|linked|\blinks?\b|network|connected|edges?"
EVIDENCE_RE = r"evidence|\bfiles?\b|uploaded|documents?|\bcdr\b|statement"
TYPE_PATTERNS: List[Tuple[str, str, str]] = [
    ("phone", r"phone|mobile|calling|caller|\bcalls?\b|numbers?\b", "Phone numbers"),
    ("upi_handle", r"\bupi\b|\bvpa\b|handles?\b", "UPI handles"),
    ("account", r"account|\bbank\b|beneficiar|ifsc", "Bank accounts"),
    ("url", r"\burls?\b|website|domain|portal|\bc2\b|command", "URLs / domains"),
    ("ip_address", r"\bips?\b|ip address", "IP addresses"),
    ("imei", r"imei|device|handset", "IMEI / devices"),
    ("imsi", r"imsi|\bsim\b", "IMSI / SIM"),
    ("email", r"e-?mail", "Email addresses"),
]

# Signals that a question is about the whole portfolio even when a case is open.
GLOBAL_RE = (
    r"\bcases\b|investigations|statewide|across (?:all|the)|overall|total|how many (?:cases|high|medium|low)"
    r"|which case|riskiest|highest[- ]risk case|top scam|scam (?:trends?|categories|types)|district|hotspot|compare"
)
G_SHARED_RE = r"shar|overlap|cross|syndicate|common|same (?:account|upi|phone|number|entit)|reuse|linked (?:cases|to each)"
G_SCAM_RE = r"scam|categor|\btypes?\b|modus|trend|pattern"
G_DISTRICT_RE = r"district|region|hotspot|geograph|where"
G_STATS_RE = r"how many|count|number of|statistics|stats|total|breakdown|distribution"
G_TOP_RE = r"highest|\btop\b|most (?:critical|risky|severe|urgent)|priority|worst|critical|urgent|riskiest"
G_PENDING_RE = r"unscored|pending|awaiting|not (?:yet )?(?:scored|correlated)|\bfresh\b|no evidence"
G_LIST_RE = r"list|recent|all cases|active|show|investigations|open cases|latest|cases"


def _wants_global(q: str) -> bool:
    """Portfolio-level question asked while a case is open. Cross-case questions about the
    open case ("are there cross-case links?") stay case-scoped."""
    if _has(q, r"this case|the current case|open case|current case"):
        return False
    if _has(q, CROSS_RE) and not _has(q, r"\bcases\b|which case|compare"):
        return False
    return _has(q, GLOBAL_RE)


# --------------------------------------------------------------------------- #
# Case-scoped answers
# --------------------------------------------------------------------------- #
def _case_suggestions(cd: CaseData) -> List[str]:
    s = ["What are the high-risk entities?"]
    s.append("Which cases share indicators with this one?" if cd.cross else "Are there cross-case syndicate links?")
    s.append("What legal directives are recommended?")
    return s


def _answer_case(cd: CaseData, q: str) -> Tuple[str, List[str]]:
    case = cd.case
    num = case.case_number
    sugg = _case_suggestions(cd)
    scam = pretty(case.scam_type)

    # 1. cross-case / syndicate
    if _has(q, CROSS_RE):
        if cd.cross:
            lines = []
            for x in cd.cross[:6]:
                others = ", ".join(o["case_number"] for o in x["other_cases"])
                lines.append(f"- **{pretty(x['entity_type'])}** `{clean(x['value'])}` also appears in **{others}**")
            nums = ", ".join(cd.cross_case_numbers)
            return (
                f"**Cross-Case Intelligence Match — {num}**\n\n"
                f"{len(cd.cross)} indicator(s) in this case are also present in: **{nums}**.\n\n"
                + "\n".join(lines) + (f"\n*…and {len(cd.cross) - 6} more*" if len(cd.cross) > 6 else "")
                + "\n\nShared payment/device infrastructure suggests the same operator or syndicate — consider coordinating with the officers handling those cases."
            ), sugg
        if not cd.entities:
            return f"No indicators have been correlated for {num} yet, so cross-case matching isn't possible. Upload evidence first.", sugg
        return (
            f"No cross-case overlaps detected for {num}. All {len(cd.entities)} indicators are unique to this complaint."
        ), sugg

    # 2. summary
    if _has(q, SUMMARY_RE):
        if cd.summary and cd.summary.narrative_text:
            narrative = cd.summary.narrative_text
        else:
            narrative = (
                f"Case {num} involves victim {case.victim_name} in {case.district or 'the jurisdiction'}, "
                f"categorised as {scam}. "
                + (
                    f"{len(cd.entities)} indicators and {len(cd.links)} connections are on record."
                    if cd.entities
                    else "No evidence has been ingested yet — upload bank/UPI, telecom or device evidence to begin correlation."
                )
            )
        return f"**Investigation Brief — Case {num} ({scam})**\n\n{narrative}", sugg

    # 3. next steps / legal
    if _has(q, ACTION_RE):
        upi = [e.value for e in cd.by_type.get("upi_handle", [])]
        acc = [e.value for e in cd.by_type.get("account", [])]
        phone = [e.value for e in cd.by_type.get("phone", [])]
        urls = [e.value for e in cd.by_type.get("url", [])]
        steps = []
        freeze = (upi[:1] + acc[:1])
        if freeze:
            steps.append(f"**Debit Freeze Requisition:** issue a Section 91 CrPC notice to the nodal bank / NPCI for {_fmt_list(freeze, 2)}.")
        if phone:
            steps.append(f"**Telecom Requisition:** request CAF/SDR and CDR for calling line `{phone[0]}`.")
        if urls:
            steps.append(f"**Takedown Notice:** transmit a Section 69A IT Act blocking request for `{clean(urls[0])}`.")
        if cd.cross:
            steps.append(f"**Coordinate:** shared indicators exist with {', '.join(cd.cross_case_numbers)} — align freezes and requisitions.")
        if not steps:
            return (
                f"No actionable indicators (accounts, UPI handles, phones or URLs) are on record for {num} yet. "
                "Upload bank/UPI or telecom evidence so freeze and requisition targets can be identified."
            ), sugg
        numbered = "\n".join(f"{i}. {s}" for i, s in enumerate(steps, 1))
        return f"**Recommended Investigative Protocol — Case {num}:**\n\n{numbered}", sugg

    # 4. risk
    if _has(q, RISK_RE):
        flag = f"\n\n**Primary Detection Flag:** {case.why_flagged}" if case.why_flagged else ""
        if cd.high_risk:
            items = []
            for e in cd.high_risk[:6]:
                reason = f" — {clean(e.anomaly_reason, 100)}" if e.anomaly_reason else ""
                items.append(f"- **{pretty(e.entity_type)}**: `{clean(e.value)}`{reason}")
            return (
                f"**High-Risk Indicators for Case {num}** (Risk Score: {risk_text(case, dash=True)})\n\n"
                + "\n".join(items)
                + (f"\n*…and {len(cd.high_risk) - 6} more high-risk indicators*" if len(cd.high_risk) > 6 else "")
                + flag
            ), sugg
        head = f"**Risk Assessment — Case {num}:** {risk_text(case)}"
        if case.risk_score is None and not cd.entities:
            return f"{head}\n\nNo evidence has been correlated yet, so there is nothing to score. Upload evidence to begin analysis.", sugg
        return f"{head}\n\nNo individual indicators are flagged high-risk.{flag}", sugg

    # 5. specific indicator types ("which UPI handles…", "what phone numbers…")
    wanted = [(t, label) for t, pat, label in TYPE_PATTERNS if _has(q, pat)]
    if wanted and not _has(q, r"suspect|mule|\bwho\b"):
        blocks = []
        for t, label in wanted:
            ents = cd.by_type.get(t, [])
            if ents:
                blocks.append(f"**{label} ({len(ents)}):** " + _fmt_list([e.value for e in ents], 8))
            else:
                blocks.append(f"**{label}:** none on record")
        return f"**Indicators — Case {num}**\n\n" + "\n".join(blocks), sugg

    # 6. suspects / mules (combined view)
    if _has(q, SUSPECT_RE):
        order = [("upi_handle", "UPI handles"), ("account", "Bank accounts"), ("phone", "Phone numbers"), ("url", "URLs / domains")]
        lines = []
        for t, label in order:
            ents = cd.by_type.get(t, [])
            if ents:
                lines.append(f"- **{label} ({len(ents)}):** " + _fmt_list([e.value for e in ents], 3))
        if not lines:
            return f"No payment, phone or web indicators have been isolated yet for {num}. Upload bank or CDR evidence to correlate.", sugg
        return (
            f"**Suspect Indicators — Case {num}** (highest risk first)\n\n" + "\n".join(lines)
            + "\n\n*Recommended action: issue debit-freeze notices to the nodal bank for the top-ranked accounts / UPI handles.*"
        ), sugg

    # 7. connections
    if _has(q, LINKS_RE):
        if not cd.links:
            return f"No connections have been established for {num} yet.", sugg
        top = sorted(cd.links, key=lambda l: -l.confidence)
        lines = []
        for l in top:
            a, b = cd.ent_index.get(l.entity_a_id), cd.ent_index.get(l.entity_b_id)
            if a and b:
                tag = " · cross-case" if a.case_id != b.case_id else ""
                lines.append(f"- `{clean(a.value, 40)}` ↔ `{clean(b.value, 40)}` — {clean(l.basis, 60)} ({l.confidence:.0%}{tag})")
            if len(lines) == 6:
                break
        n = len(cd.links)
        return (
            f"**Connections — Case {num}:** {n} link{'s' if n != 1 else ''} across {len(cd.entities)} indicators.\n\nStrongest:\n"
            + "\n".join(lines)
        ), sugg

    # 8. evidence
    if _has(q, EVIDENCE_RE):
        files = case.evidence_files
        if not files:
            return f"No evidence files have been uploaded for {num} yet.", sugg
        lines = [f"- `{clean(f.original_filename, 50)}` — {enum_val(f.evidence_category)}, {enum_val(f.upload_status)}" for f in files[:8]]
        return f"**Evidence — Case {num}** ({len(files)} file(s))\n\n" + "\n".join(lines), sugg

    # default overview
    return (
        f"**Case {num} — Intelligence Snapshot**\n"
        f"- **Victim:** {case.victim_name} ({case.district or 'district unresolved'})\n"
        f"- **Category:** {scam}\n"
        f"- **Risk:** {risk_text(case)}\n"
        f"- **Indicators:** {len(cd.entities)} entities ({len(cd.high_risk)} high-risk), {len(cd.links)} connections\n"
        f"- **Cross-case matches:** {', '.join(cd.cross_case_numbers) if cd.cross else 'none'}\n\n"
        "Ask about high-risk entities, suspect accounts, cross-case links or legal directives."
    ), sugg


# --------------------------------------------------------------------------- #
# Multi-case comparison
# --------------------------------------------------------------------------- #
def _answer_compare(db: Session, cases: List[Case]) -> Tuple[str, List[str]]:
    datas = [ctx.load_case_data(db, c) for c in cases]
    lines = []
    for cd in datas:
        c = cd.case
        lines.append(
            f"- **{c.case_number}** — {clean(c.victim_name, 40)} · {pretty(c.scam_type)} · {c.district or 'district unresolved'} · "
            f"Risk {risk_text(c)} · {len(cd.entities)} entities ({len(cd.high_risk)} high-risk) · {len(cd.links)} links"
        )
    ids = [c.id for c in cases]
    shared = ctx.shared_entities(db, ids)
    shared = [s for s in shared if len([i for i in s["case_ids"] if i in ids]) >= 2]
    if shared:
        sl = [f"- {pretty(s['entity_type'])} `{clean(s['value'])}` → {', '.join(n for n, i in zip(s['cases'], s['case_ids']) if i in ids)}" for s in shared[:8]]
        tail = "\n\n**Shared indicators (" + str(len(shared)) + "):**\n" + "\n".join(sl) + (f"\n*…and {len(shared) - 8} more*" if len(shared) > 8 else "")
        tail += "\n\nOverlapping infrastructure points to a common operator — consider a joint investigation."
    else:
        tail = "\n\nNo indicators are shared between these cases."
    names = " vs ".join(c.case_number for c in cases)
    return f"**Comparison — {names}**\n\n" + "\n".join(lines) + tail, ["Which cases share entities?", "Which is the highest risk case?", "List active investigations"]


# --------------------------------------------------------------------------- #
# Portfolio-level answers
# --------------------------------------------------------------------------- #
def _case_line(c: Case) -> str:
    return f"- **{c.case_number}** — {clean(c.victim_name, 40)} ({pretty(c.scam_type)}) | Risk: `{risk_text(c)}`"


def _answer_global(db: Session, q: str) -> Tuple[str, List[str]]:
    counts = ctx.portfolio_counts(db)
    lb = counts["by_level"]
    total = counts["total"]
    sugg = ["How many high-risk cases are open?", "Which cases share entities?", "Which is the highest risk case?"]

    if total == 0:
        return "No cases are registered in TraceX yet. Register a new investigation to get started.", sugg

    if _has(q, G_SHARED_RE):
        shared = ctx.shared_entities(db)
        if not shared:
            return f"No indicators are shared across the {total} registered cases — every case is currently isolated.", sugg
        lines = [f"- **{pretty(s['entity_type'])}** `{clean(s['value'])}` [{s['risk_level']}] → {', '.join(s['cases'])}" for s in shared[:8]]
        linked = sorted({n for s in shared for n in s['cases']})
        return (
            f"**Cross-Case Shared Indicators ({len(shared)})**\n\n" + "\n".join(lines) + (f"\n*…and {len(shared) - 8} more*" if len(shared) > 8 else "")
            + f"\n\nCases connected through shared infrastructure: **{', '.join(linked)}**. This suggests a coordinated network reusing accounts, handles or devices."
        ), sugg

    if _has(q, G_SCAM_RE):
        avg: Dict[str, List[float]] = {}
        for c in ctx.all_cases_ranked(db):
            if c.risk_score is not None:
                avg.setdefault(enum_val(c.scam_type), []).append(c.risk_score)
        lines = []
        for t, n in sorted(counts["by_type"].items(), key=lambda kv: -kv[1]):
            scores = avg.get(t)
            extra = f" — avg risk {sum(scores) / len(scores):.0f}/100" if scores else " — not yet scored"
            lines.append(f"- **{pretty(t)}:** {n} case(s){extra}")
        return f"**Scam Category Distribution ({total} cases)**\n\n" + "\n".join(lines), sugg

    if _has(q, G_DISTRICT_RE):
        lines = [f"- **{d}:** {n} case(s)" for d, n in sorted(counts["by_district"].items(), key=lambda kv: -kv[1])[:8]]
        return f"**Cases by District**\n\n" + "\n".join(lines), sugg

    if _has(q, G_STATS_RE):
        unscored = lb["unscored"]
        return (
            "**Operations Room Statistics**\n\n"
            f"- **Total Active Investigations:** {total}\n"
            f"- **High-Risk Priority Cases:** {lb['high']}\n"
            f"- **Medium-Risk Cases:** {lb['medium']}\n"
            f"- **Low-Risk / Monitoring:** {lb['low']}\n"
            f"- **Awaiting scoring / evidence:** {unscored}\n"
            f"- **Correlated entities:** {counts['entities']} across {counts['links']} links"
        ), sugg

    if _has(q, G_TOP_RE):
        ranked = [c for c in ctx.all_cases_ranked(db) if c.risk_score is not None]
        if not ranked:
            return "No cases have been risk-scored yet.", sugg
        top = ranked[:3]
        best = top[0]
        return (
            f"**Highest-risk case: {best.case_number}** — {clean(best.victim_name, 40)} ({pretty(best.scam_type)}), risk {risk_text(best)}.\n"
            + (f"Detection basis: {best.why_flagged}\n" if best.why_flagged else "")
            + "\n**Top cases by risk score:**\n" + "\n".join(_case_line(c) for c in top)
        ), sugg

    if _has(q, G_PENDING_RE):
        pend = [c for c in ctx.all_cases_ranked(db) if c.risk_score is None]
        if not pend:
            return "All registered cases have been risk-scored.", sugg
        return f"**Awaiting scoring ({len(pend)}):**\n\n" + "\n".join(_case_line(c) for c in pend), sugg

    if _has(q, G_LIST_RE):
        cases = ctx.all_cases_ranked(db)[:8]
        return f"**Investigations ({len(cases)} of {total}, highest risk first):**\n\n" + "\n".join(_case_line(c) for c in cases), sugg

    example = ctx.all_cases_ranked(db)[0].case_number
    return (
        "**TraceX Cyber Crime Intelligence Assistant**\n\n"
        f"Monitoring **{total} investigations** ({lb['high']} high-risk, {lb['unscored']} awaiting scoring).\n\n"
        "You can ask me:\n"
        f"- About a case, e.g. *'Summarize case {example}'* (or open a case and ask directly)\n"
        "- Statistics, e.g. *'How many high-risk cases are open?'*\n"
        "- Cross-case analysis, e.g. *'Which cases share entities?'* or *'Compare two cases'*\n"
        "- Lookups, e.g. paste a phone number, UPI handle or account to see where it appears."
    ), sugg


# --------------------------------------------------------------------------- #
# Indicator lookup
# --------------------------------------------------------------------------- #
def _answer_entity_lookup(db: Session, hits: List[Entity]) -> Tuple[str, List[str]]:
    case_map = {c.id: c for c in db.query(Case).filter(Case.id.in_({e.case_id for e in hits})).all()}
    groups: Dict[Tuple[str, str], List[Entity]] = {}
    for e in hits:
        groups.setdefault((enum_val(e.entity_type), e.value), []).append(e)
    blocks = []
    for (t, v), ents in list(groups.items())[:3]:
        lines = [f"**{pretty(t)} `{clean(v)}`** — found in {len(ents)} case(s):"]
        for e in ents:
            c = case_map.get(e.case_id)
            reason = f" — {clean(e.anomaly_reason, 100)}" if e.anomaly_reason else ""
            lines.append(f"- **{c.case_number if c else e.case_id}** · risk `{enum_val(e.risk_level)}`{reason}")
        neigh = ctx.entity_neighbours(db, [e.id for e in ents], limit=5, exclude_value=v)
        if neigh:
            lines.append("Directly connected to:")
            lines += [f"- {pretty(n['type'])} `{clean(n['value'], 50)}` ({clean(n['basis'], 50)})" for n in neigh]
        if len(ents) > 1:
            lines.append("*Appears in multiple investigations — possible shared infrastructure.*")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks), ["Which cases share entities?", "What are the high-risk entities?", "List active investigations"]


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def _llm_suggestions(mode: str) -> List[str]:
    if mode == "case":
        return ["What are the high-risk entities?", "Are there cross-case syndicate links?", "What legal directives are recommended?"]
    return ["Which cases share entities?", "Which is the highest risk case?", "List active investigations"]


def answer_chat(db: Session, message: str, ui_case_id: Optional[int] = None, history: Optional[List[Any]] = None) -> ChatResult:
    q = message.lower().strip()
    notes: List[str] = []

    ui_case: Optional[Case] = None
    if ui_case_id:
        ui_case = db.query(Case).filter(Case.id == ui_case_id).first()
        if not ui_case:
            notes.append(f"*Case with id {ui_case_id} was not found; answering across all cases.*")

    mentioned = ctx.find_mentioned_cases(db, message)
    for ref in ctx.find_unresolved_case_refs(db, message):
        notes.append(f"*I couldn't find a case matching “{ref}” in TraceX.*")
    entity_hits = ctx.find_entity_matches(db, message)

    # ---- decide scope -----------------------------------------------------
    scope_cases: List[Case] = []
    if len(mentioned) >= 2:
        scope_cases = mentioned
        mode = "compare"
    elif len(mentioned) == 1:
        scope_cases = mentioned
        mode = "case"
    elif entity_hits:
        mode = "entity"
    elif ui_case and not _wants_global(q):
        scope_cases = [ui_case]
        mode = "case"
    else:
        mode = "global"

    # a lone named case + comparison wording while another case is open → compare with the open one
    if mode == "case" and ui_case and scope_cases[0].id != ui_case.id and _has(q, r"compare|versus|\bvs\b|difference"):
        scope_cases = [ui_case] + scope_cases
        mode = "compare"

    focus = scope_cases[0] if mode == "case" else None
    focus_id = focus.id if focus else None
    focus_number = focus.case_number if focus else None

    def finish(result: ChatResult) -> ChatResult:
        if notes:
            result.response = "\n".join(notes) + "\n\n" + result.response
        return result

    # ---- 1. PRIMARY PATH: the LLM reasons over the case context -----------
    llm_error: Optional[str] = None
    if llm_configured():
        try:
            context = ctx.build_llm_context(db, scope_cases, entity_hits, ui_case)
            llm = ask_llm(message, context, history)
        except Exception as exc:  # never let the AI layer break the chat
            logger.exception("Chat LLM context/call failed")
            llm = LLMResult(error=f"context_error:{exc.__class__.__name__}")
        if llm.text:
            return finish(
                ChatResult(
                    response=llm.text,
                    case_id=focus_id,
                    case_number=focus_number,
                    suggested=_llm_suggestions(mode),
                    source="llm",
                )
            )
        llm_error = llm.error or "unknown"
        logger.warning("Falling back to rules engine (LLM error: %s)", llm_error)
    else:
        logger.warning(
            "LLM not configured (set OPENAI_API_KEY) - chat is answering from the rules engine only"
        )

    # ---- 2. FALLBACK: deterministic, data-driven answer ---------------------
    if mode == "compare":
        text, sugg = _answer_compare(db, scope_cases)
    elif mode == "case":
        text, sugg = _answer_case(ctx.load_case_data(db, scope_cases[0]), q)
    elif mode == "entity":
        text, sugg = _answer_entity_lookup(db, entity_hits)
    else:
        text, sugg = _answer_global(db, q)

    result = ChatResult(response=text, case_id=focus_id, case_number=focus_number, suggested=sugg, source="rules")
    if llm_error:
        result.response += FALLBACK_NOTE
        result.source = "rules_fallback"
        result.llm_error = llm_error
    return finish(result)
