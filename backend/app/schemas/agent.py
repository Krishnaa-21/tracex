from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AgentDefinitionRead(BaseModel):
    id: str
    name: str
    role: str
    description: str
    category: str
    access: str
    outputs: List[str]


class AgentRunRead(BaseModel):
    id: int
    case_id: int
    agent_id: str
    agent_name: str
    status: str
    summary: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime
    parent_run_id: Optional[int] = None
    result: Dict[str, Any] = {}
