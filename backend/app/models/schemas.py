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
