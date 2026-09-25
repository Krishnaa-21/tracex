"""Single place that decides how TraceX talks to an LLM (OpenAI by default).

Why this exists
---------------
Previously the chat layer and the case-summary layer each read ``AI_SUMMARY_*``
settings on their own and silently returned ``None`` on *any* problem (missing URL,
wrong model, unsupported parameter, quota...). The chatbot then quietly answered from
the rules engine, so it looked like the LLM was "not being used" with no clue why.

This module:
  * resolves configuration from ``OPENAI_API_KEY`` (preferred) or the legacy
    ``AI_SUMMARY_*`` variables - reading both ``settings`` and the raw environment;
  * defaults the URL to OpenAI when only a key is supplied;
  * adapts the request to the model family (GPT-5 / o-series reject ``temperature``
    and ``max_tokens``);
  * returns a structured ``LLMResult`` with an error *code* instead of a bare ``None``.

Environment variables (set these in Render)
-------------------------------------------
  OPENAI_API_KEY   required   your OpenAI key (sk-...)
  OPENAI_MODEL     optional   default: gpt-4o-mini
  OPENAI_BASE_URL  optional   default: https://api.openai.com/v1
  AI_CHAT_TIMEOUT_SECONDS optional  default: 30
Legacy AI_SUMMARY_API_KEY / AI_SUMMARY_API_URL / AI_SUMMARY_MODEL still work when
OPENAI_API_KEY is not set.
"""
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger("tracex.llm")

OPENAI_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"
DEFAULT_TIMEOUT = 30.0
_PLACEHOLDERS = {"", "your_key_here", "changeme", "none", "null"}


# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
def _first(*names: str) -> Tuple[str, str]:
    """First real value among ``names`` (checking settings, then os.environ).

    Returns (value, name_it_came_from) or ("", "").
    """
    for name in names:
        raw = getattr(settings, name, None)
        if raw in (None, ""):
            raw = os.getenv(name)
        val = str(raw).strip() if raw is not None else ""
        if val and val.lower() not in _PLACEHOLDERS:
            return val, name
    return "", ""


def _normalise_url(url: str) -> str:
    """Accept either a base URL (.../v1) or the full chat-completions URL."""
    url = url.strip().rstrip("/")
    if not url.endswith("/chat/completions"):
        url += "/chat/completions"
    return url


@dataclass(frozen=True)
class LLMConfig:
    api_key: str
    url: str
    model: str
    timeout: float
    key_source: str  # NAME of the variable the key came from (never the key itself)

    @property
    def host(self) -> str:
        return urlparse(self.url).hostname or ""

    @property
    def is_openai(self) -> bool:
        return self.host == "api.openai.com"

    @property
    def is_reasoning_model(self) -> bool:
        # GPT-5 family and o-series: no `temperature`, need `max_completion_tokens`,
        # and reasoning tokens count against the output budget.
        return self.model.lower().startswith(("gpt-5", "o1", "o3", "o4"))


def get_llm_config() -> Optional[LLMConfig]:
    key, key_src = _first("OPENAI_API_KEY", "AI_SUMMARY_API_KEY")
    if not key:
        return None

    if key_src == "OPENAI_API_KEY":
        url = _first("OPENAI_BASE_URL")[0] or OPENAI_URL
        model = _first("OPENAI_MODEL")[0] or DEFAULT_MODEL
    else:  # legacy variables
        url = _first("AI_SUMMARY_API_URL")[0] or (OPENAI_URL if key.startswith("sk-") else "")
        model = _first("AI_SUMMARY_MODEL")[0] or DEFAULT_MODEL
        if not url:
            return None  # a non-OpenAI key with no URL cannot work

    try:
        timeout = float(_first("AI_CHAT_TIMEOUT_SECONDS")[0] or DEFAULT_TIMEOUT)
    except ValueError:
        timeout = DEFAULT_TIMEOUT

    return LLMConfig(api_key=key, url=_normalise_url(url), model=model, timeout=timeout, key_source=key_src)


def llm_configured() -> bool:
    return get_llm_config() is not None


# --------------------------------------------------------------------------- #
# Calling the model
# --------------------------------------------------------------------------- #
@dataclass
class LLMResult:
    text: Optional[str] = None
    error: Optional[str] = None   # short machine-readable code, safe to show to the UI
    detail: Optional[str] = None  # redacted provider message, for logs / status endpoint only


_ERROR_CODES = {
    400: "bad_request",
    401: "auth_failed",       # key rejected
    403: "forbidden",         # key/project has no access to this model
    404: "not_found",         # wrong URL or model name
    429: "rate_limited",      # rate limit OR out of quota
}
_KEY_RE = re.compile(r"sk-[A-Za-z0-9_\-\*\.]{4,}")


def _redact(text: str) -> str:
    return _KEY_RE.sub("sk-***", text or "")


def _build_payload(cfg: LLMConfig, messages: List[Dict[str, str]], temperature: float, max_output_tokens: int) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"model": cfg.model, "messages": messages}
    if cfg.is_reasoning_model:
        payload["max_completion_tokens"] = max(max_output_tokens * 4, 2000)
    else:
        payload["temperature"] = temperature
        payload["max_completion_tokens" if cfg.is_openai else "max_tokens"] = max_output_tokens
    return payload


def _adapt_payload(payload: Dict[str, Any], body: str) -> bool:
    """React to a 400 that names an unsupported parameter. True if payload was changed."""
    low = (body or "").lower()
    if "temperature" in payload and "temperature" in low:
        payload.pop("temperature")
        return True
    if "max_tokens" in payload and "max_tokens" in low:
        payload["max_completion_tokens"] = payload.pop("max_tokens")
        return True
    if "max_completion_tokens" in payload and "max_completion_tokens" in low:
        payload["max_tokens"] = payload.pop("max_completion_tokens")
        return True
    return False


def _http_error(resp: httpx.Response) -> LLMResult:
    detail = ""
    try:
        err = resp.json().get("error")
        detail = err.get("message", "") if isinstance(err, dict) else str(err or "")
    except Exception:
        detail = resp.text[:200]
    detail = _redact(detail)[:300]
    logger.warning("LLM returned HTTP %s: %s", resp.status_code, detail)
    return LLMResult(error=_ERROR_CODES.get(resp.status_code, f"http_{resp.status_code}"), detail=detail)


def chat_completion(
    messages: List[Dict[str, str]],
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 900,
    timeout: Optional[float] = None,
) -> LLMResult:
    cfg = get_llm_config()
    if cfg is None:
        return LLMResult(error="not_configured")

    payload = _build_payload(cfg, messages, temperature, max_output_tokens)
    headers = {"Authorization": f"Bearer {cfg.api_key}", "Content-Type": "application/json"}
    http_timeout = httpx.Timeout(timeout or cfg.timeout, connect=5.0)

    resp: Optional[httpx.Response] = None
    for _ in range(3):  # at most two parameter adjustments
        try:
            with httpx.Client(timeout=http_timeout) as client:
                resp = client.post(cfg.url, headers=headers, json=payload)
        except httpx.TimeoutException:
            logger.warning("LLM call timed out after %ss (model=%s)", timeout or cfg.timeout, cfg.model)
            return LLMResult(error="timeout")
        except httpx.HTTPError as exc:
            logger.warning("LLM network error: %s", exc.__class__.__name__)
            return LLMResult(error="network_error", detail=exc.__class__.__name__)
        if resp.status_code == 400 and _adapt_payload(payload, resp.text):
            logger.info("LLM rejected a parameter for model %s; retrying adjusted", cfg.model)
            continue
        break

    assert resp is not None
    if resp.status_code != 200:
        return _http_error(resp)

    try:
        choice = resp.json()["choices"][0]
        text = choice["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        logger.warning("LLM returned an unexpected payload shape")
        return LLMResult(error="bad_payload")

    text = (text or "").strip()
    if not text:
        # Typical for reasoning models that spent the whole budget thinking.
        return LLMResult(error="empty_response", detail=f"finish_reason={choice.get('finish_reason')}")
    return LLMResult(text=text)
