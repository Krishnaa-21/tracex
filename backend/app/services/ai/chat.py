import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_officer
from app.db.database import get_db
from app.db.models import Officer
from app.services.ai.chat_engine import answer_chat
from app.services.ai.llm_client import chat_completion, get_llm_config

logger = logging.getLogger("tracex.chat")

router = APIRouter(prefix="/chat", tags=["chat"])

MAX_MESSAGE_CHARS = 2000


class ChatHistoryItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    case_id: Optional[int] = None
    # Recent turns, used only to resolve follow-up questions when an LLM is configured.
    history: List[ChatHistoryItem] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    suggested_actions: List[str] = []
    timestamp: str
    # llm = AI-written | rules = LLM not configured, answered from case data |
    # rules_fallback = LLM configured but failed, answered from case data |
    # error = internal failure (friendly message returned)
    source: str = "rules"
    # Short error code (e.g. auth_failed, not_found, rate_limited, timeout) when source == rules_fallback
    llm_error: Optional[str] = None


@router.post("", response_model=ChatResponse)
def handle_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    """Process an officer inquiry with case-aware (or cross-case) intelligence."""
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")
    if len(msg) > MAX_MESSAGE_CHARS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Message is too long (max {MAX_MESSAGE_CHARS} characters)",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        result = answer_chat(db, msg, req.case_id, req.history)
    except Exception:
        # Never return a blank/500 to the chat widget: log it and answer gracefully.
        logger.exception("Chat request failed (case_id=%s)", req.case_id)
        return ChatResponse(
            response=(
                "I couldn't retrieve that intelligence just now. Please try again in a moment; "
                "if it keeps happening, contact your system administrator."
            ),
            case_id=req.case_id,
            suggested_actions=[],
            timestamp=now_iso,
            source="error",
        )

    return ChatResponse(
        response=result.response,
        case_id=result.case_id,
        case_number=result.case_number,
        suggested_actions=result.suggested,
        timestamp=now_iso,
        source=result.source,
        llm_error=result.llm_error,
    )


@router.get("/status")
def chat_status(
    ping: bool = True,
    current_officer: Officer = Depends(get_current_officer),
):
    """Diagnose the LLM setup. Open /api/chat/status while logged in.

    Never returns the API key - only the NAME of the variable it was read from.
    """
    cfg = get_llm_config()
    if cfg is None:
        return {
            "llm_configured": False,
            "hint": "No usable key found. Set OPENAI_API_KEY in the Render environment and redeploy.",
        }
    out = {
        "llm_configured": True,
        "provider_host": cfg.host,
        "model": cfg.model,
        "key_source": cfg.key_source,
        "timeout_seconds": cfg.timeout,
    }
    if ping:
        res = chat_completion(
            [{"role": "user", "content": "Reply with the single word OK."}],
            max_output_tokens=20,
            timeout=15,
        )
        out["ping_ok"] = bool(res.text)
        out["ping_error"] = res.error
        out["ping_detail"] = res.detail
    return out
