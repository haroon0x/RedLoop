from fastapi import APIRouter
from pathlib import Path
from ..models.schemas import ScanRequest, ScanResponse, FixRequest, FixResponse
from ..core.adversary import AdversaryAgent
from ..core.defender import DefenderAgent

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ATTACK_VECTORS_PATH = BASE_DIR / "data" / "attack_vectors.json"
ADVERSARY_PROMPT_PATH = BASE_DIR / "prompts" / "adversary.md"
DEFENDER_PROMPT_PATH = BASE_DIR / "prompts" / "defender.md"

adversary = AdversaryAgent(ATTACK_VECTORS_PATH, ADVERSARY_PROMPT_PATH)
defender = DefenderAgent(DEFENDER_PROMPT_PATH)

@router.post("/scan", response_model=ScanResponse)
async def scan_code(request: ScanRequest):
    target_path = Path(request.target_path)
    vulns = await adversary.analyze_code(target_path)
    return ScanResponse(vulnerabilities=vulns, count=len(vulns))

@router.post("/fix", response_model=FixResponse)
async def fix_vulnerabilities(request: FixRequest):
    fixes = await defender.generate_fixes(request.vulnerabilities)
    return FixResponse(fixes=fixes, count=len(fixes))

@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
