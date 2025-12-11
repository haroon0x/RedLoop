from fastapi import APIRouter
from pathlib import Path
from ..models.schemas import (
    ScanRequest, ScanResponse, FixRequest, FixResponse,
    KestraFlowRequest, KestraExecutionResponse, KestraStatusResponse
)
from ..core.adversary import AdversaryAgent
from ..core.defender import DefenderAgent
from ..core.kestra_client import KestraClient

router = APIRouter()
kestra = KestraClient()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ATTACK_VECTORS_PATH = BASE_DIR / "data" / "attack_vectors.json"
ADVERSARY_PROMPT_PATH = BASE_DIR / "prompts" / "adversary.md"
DEFENDER_PROMPT_PATH = BASE_DIR / "prompts" / "defender.md"

adversary = AdversaryAgent(ATTACK_VECTORS_PATH, ADVERSARY_PROMPT_PATH)
defender = DefenderAgent(DEFENDER_PROMPT_PATH)


# ═══════════════════════════════════════════════════════════════════════════
# Core Scan Endpoints
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/scan", response_model=ScanResponse)
async def scan_code(request: ScanRequest):
    """Scan code for vulnerabilities using the Adversary agent."""
    target_path = Path(request.target_path)
    vulns = await adversary.analyze_code(target_path)
    return ScanResponse(vulnerabilities=vulns, count=len(vulns))


@router.post("/fix", response_model=FixResponse)
async def fix_vulnerabilities(request: FixRequest):
    """Generate fixes for detected vulnerabilities using the Defender agent."""
    fixes = await defender.generate_fixes(request.vulnerabilities)
    return FixResponse(fixes=fixes, count=len(fixes))


# ═══════════════════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/health")
async def health_check():
    """Health check endpoint for the backend service."""
    return {"status": "ok", "version": "0.1.0"}


# ═══════════════════════════════════════════════════════════════════════════
# Kestra Integration Endpoints
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/kestra/status")
async def kestra_status():
    """Check if Kestra is online and get flow count."""
    return await kestra.get_status()


@router.post("/kestra/trigger", response_model=KestraExecutionResponse)
async def trigger_kestra_flow(request: KestraFlowRequest):
    """
    Trigger the RedLoop security scan workflow in Kestra.
    
    This starts the full security assessment pipeline:
    1. Clone repository
    2. Run Cline adversary scan
    3. Run Kestra AI fallback (if needed)
    4. Generate summary and fixes
    """
    result = await kestra.trigger_flow(
        repository_url=request.repository_url,
        branch=request.branch
    )
    return KestraExecutionResponse(**result)


@router.get("/kestra/execution/{execution_id}")
async def get_kestra_execution(execution_id: str):
    """
    Get the status and results of a Kestra execution.
    
    States: CREATED, RUNNING, SUCCESS, FAILED, KILLED
    """
    return await kestra.get_execution_status(execution_id)


@router.get("/kestra/execution/{execution_id}/logs")
async def get_kestra_logs(execution_id: str, limit: int = 50):
    """Get logs from a Kestra execution."""
    return await kestra.get_execution_logs(execution_id, limit)
