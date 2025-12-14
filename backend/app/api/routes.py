from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pathlib import Path
from ..models.schemas import (
    ScanRequest, ScanResponse, FixRequest, FixResponse,
    KestraFlowRequest, KestraExecutionResponse, KestraStatusResponse
)
from ..core.adversary import AdversaryAgent
from ..core.defender import DefenderAgent
from ..core.kestra_client import KestraClient
import json

router = APIRouter()
kestra = KestraClient()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ATTACK_VECTORS_PATH = BASE_DIR / "data" / "attack_vectors.json"
ADVERSARY_PROMPT_PATH = BASE_DIR / "prompts" / "adversary.md"
DEFENDER_PROMPT_PATH = BASE_DIR / "prompts" / "defender.md"

adversary = AdversaryAgent(ATTACK_VECTORS_PATH, ADVERSARY_PROMPT_PATH)
defender = DefenderAgent(DEFENDER_PROMPT_PATH)


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


@router.get("/health")
async def health_check():
    """Health check endpoint for the backend service."""
    return {"status": "ok", "version": "0.1.0"}


@router.get("/kestra/status")
async def kestra_status():
    """Check if Kestra is online and get flow count."""
    return await kestra.get_status()


@router.get("/kestra/flow")
async def get_kestra_flow():
    """Get information about the RedLoop workflow."""
    return await kestra.get_flow()


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


@router.delete("/kestra/execution/{execution_id}/kill")
async def kill_kestra_execution(execution_id: str):
    """
    Kill/stop a running Kestra execution.
    
    Use this to cancel a scan that is taking too long or no longer needed.
    Returns an error if the execution is already completed.
    """
    return await kestra.kill_execution(execution_id)


@router.post("/kestra/execution/{execution_id}/replay")
async def replay_kestra_execution(execution_id: str):
    """
    Replay a previous execution with the same inputs.
    
    Creates a new execution that runs the same workflow with the same
    repository URL and branch as the original execution.
    
    Returns the new execution_id.
    """
    return await kestra.replay_execution(execution_id)


@router.post("/kestra/execution/{execution_id}/restart")
async def restart_kestra_execution(execution_id: str):
    """
    Restart a failed execution from the point of failure.
    
    Only works for executions in FAILED state. Restarts from the
    failed task, preserving outputs from completed tasks.
    
    Returns the new execution_id.
    """
    return await kestra.restart_execution(execution_id)


@router.get("/kestra/execution/{execution_id}/stream")
async def stream_kestra_execution(execution_id: str):
    """
    Stream real-time execution updates via Server-Sent Events (SSE).
    
    Data comes from webhooks that Kestra sends to the backend,
    NOT from polling Kestra directly (which avoids auth issues).
    
    Usage (JavaScript):
    ```
    const eventSource = new EventSource('/api/kestra/execution/{id}/stream');
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Update:', data);
    };
    ```
    """
    from ..core.websocket_manager import manager
    import asyncio
    
    async def event_generator():
        last_state = None
        last_task_count = 0
        retry_count = 0
        max_retries = 180  # 3 minutes max with 1s intervals
        
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'execution_id': execution_id})}\n\n"
        
        while retry_count < max_retries:
            try:
                # Get current status from webhook data
                status = manager.get_status(execution_id)
                
                if status:
                    current_state = status.get("state", "UNKNOWN")
                    current_task_count = len(status.get("tasks", {}))
                    
                    # Send update if state or tasks changed
                    if current_state != last_state or current_task_count != last_task_count:
                        update_data = {
                            'type': 'execution_update',
                            'execution_id': execution_id,
                            'state': current_state,
                            'tasks': status.get('tasks', {}),
                            'task_count': current_task_count
                        }
                        yield f"data: {json.dumps(update_data)}\n\n"
                        last_state = current_state
                        last_task_count = current_task_count
                    
                    # Check if execution is complete
                    if current_state in ["SUCCESS", "FAILED", "KILLED"]:
                        complete_data = {
                            'type': 'complete',
                            'execution_id': execution_id,
                            'state': current_state,
                            'tasks': status.get('tasks', {})
                        }
                        yield f"data: {json.dumps(complete_data)}\n\n"
                        return
                else:
                    # No status yet - execution may still be starting
                    yield f"data: {json.dumps({'type': 'waiting', 'execution_id': execution_id})}\n\n"
                
                await asyncio.sleep(1)
                retry_count += 1
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                return
        
        yield f"data: {json.dumps({'type': 'timeout', 'message': 'Stream timeout after 3 minutes'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/kestra/execution/{execution_id}/stream/logs")
async def stream_kestra_logs(execution_id: str):
    """
    Log streaming is now handled via webhooks.
    This endpoint returns a message directing to use the main stream endpoint.
    """
    async def log_generator():
        yield f"data: {json.dumps({'type': 'info', 'message': 'Logs are streamed via the main /stream endpoint from webhook data'})}\\n\\n"
    
    return StreamingResponse(
        log_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/kestra/execution/{execution_id}/files")
async def list_execution_files(execution_id: str):
    """
    List all output files from an execution.
    
    Returns file paths that can be used with the download endpoint.
    Useful for seeing what artifacts were generated by the scan.
    """
    return await kestra.get_output_files_list(execution_id)


@router.get("/kestra/execution/{execution_id}/file")
async def download_execution_file(execution_id: str, path: str):
    """
    Download a specific output file from an execution.
    
    Args:
        execution_id: The execution ID
        path: The file path (from /files endpoint)
        
    Returns the file content. Use for downloading vulnerability JSON, reports, etc.
    """
    return await kestra.download_output_file(execution_id, path)


@router.get("/kestra/execution/{execution_id}/file/preview")
async def preview_execution_file(execution_id: str, path: str, max_lines: int = 100):
    """
    Preview a file without downloading the whole thing.
    
    Useful for large files - shows first N lines.
    """
    return await kestra.preview_output_file(execution_id, path, max_lines)


@router.get("/kestra/execution/{execution_id}/logs/download")
async def download_execution_logs(execution_id: str):
    """
    Download complete execution logs as a text file.
    
    Returns the full log content for debugging or archival.
    Much more complete than the paginated logs endpoint.
    """
    return await kestra.download_logs(execution_id)


@router.get("/kestra/execution/{execution_id}/metrics")
async def get_execution_metrics(execution_id: str):
    """
    Get metrics from a specific execution.
    
    Returns timing data: how long each task took, total duration, etc.
    """
    return await kestra.get_execution_metrics(execution_id)
