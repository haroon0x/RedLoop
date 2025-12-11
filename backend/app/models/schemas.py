from pydantic import BaseModel
from typing import List, Optional, Literal

class Vulnerability(BaseModel):
    id: str
    file: str
    line: Optional[int] = None
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]
    type: str
    description: str
    payload: Optional[str] = None
    fix_suggestion: Optional[str] = None

class ScanRequest(BaseModel):
    target_path: str = "."
    auto_fix: bool = False

class ScanResponse(BaseModel):
    vulnerabilities: List[Vulnerability]
    count: int
    error: Optional[str] = None

class FixSuggestion(BaseModel):
    vulnerability_id: str
    file: str
    status: Literal["FIXED", "SKIPPED", "FAILED"]
    changes: str

class FixRequest(BaseModel):
    vulnerabilities: List[Vulnerability]

class FixResponse(BaseModel):
    fixes: List[FixSuggestion]
    count: int


# Kestra Flow Schemas
class KestraFlowRequest(BaseModel):
    repository_url: str
    branch: str = "main"


class KestraExecutionResponse(BaseModel):
    success: bool
    execution_id: Optional[str] = None
    state: Optional[str] = None
    error: Optional[str] = None
    namespace: Optional[str] = None
    flow_id: Optional[str] = None


class KestraStatusResponse(BaseModel):
    success: bool
    execution_id: str
    state: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    task_count: int = 0
    outputs: dict = {}
    error: Optional[str] = None
