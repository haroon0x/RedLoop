from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any
from ..core.websocket_manager import manager
import logging
import json

# Configure module logger
logger = logging.getLogger(__name__)

webhook_router = APIRouter(tags=["webhooks"])


class TaskUpdate(BaseModel):
    """Payload sent by Kestra when a task completes."""
    execution_id: str = Field(..., min_length=1, description="Kestra execution ID")
    task_id: str = Field(..., min_length=1, description="Task identifier")
    status: str = Field(..., min_length=1, description="Task status (SUCCESS, FAILED, etc)")
    message: Optional[str] = ""
    output: Optional[Any] = None
    data: Optional[Any] = None

    class Config:
        extra = "allow"  # Allow extra fields from Kestra


class ExecutionUpdate(BaseModel):
    """Payload for overall execution state changes."""
    execution_id: str = Field(..., min_length=1, description="Kestra execution ID")
    state: str = Field(..., min_length=1, description="Execution state (RUNNING, SUCCESS, FAILED)")
    message: Optional[str] = ""

    class Config:
        extra = "allow"  # Allow extra fields from Kestra


@webhook_router.post("/task-update")
async def receive_task_update(request: Request):
    """
    Receive task completion notification from Kestra.
    Broadcasts the update to all connected WebSocket clients.
    
    Uses raw JSON parsing for maximum compatibility with Kestra's output format.
    """
    try:
        body = await request.body()
        body_str = body.decode('utf-8', errors='ignore')
        logger.info(f"📡 Received webhook: {body_str[:500]}...")
        
        data = json.loads(body_str)
        
        execution_id = data.get("execution_id", "")
        task_id = data.get("task_id", "")
        status = data.get("status", "")
        message = data.get("message", "")
        output = data.get("output")
        
        if not execution_id or not task_id:
            logger.warning(f"Missing required fields: execution_id={execution_id}, task_id={task_id}")
            return {"status": "error", "message": "Missing execution_id or task_id"}
        
        logger.info(f"📡 Task Update: {task_id} -> {status}")
        
        manager.update_task_status(execution_id, task_id, status, message, output=output)
        
        await manager.broadcast_update(execution_id, {
            "type": "task_update",
            "execution_id": execution_id,
            "task_id": task_id,
            "status": status,
            "message": message,
            "output": output,
            "data": data.get("data")
        })
        
        return {"status": "received", "task_id": task_id}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {e}")
        return {"status": "error", "message": f"Invalid JSON: {str(e)}"}
    except Exception as e:
        logger.exception(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@webhook_router.post("/execution-update")
async def receive_execution_update(request: Request):
    """
    Receive execution state change from Kestra.
    Called when execution starts, completes, or fails.
    """
    try:
        body = await request.body()
        body_str = body.decode('utf-8', errors='ignore')
        logger.info(f"📡 Execution update: {body_str[:500]}...")
        
        data = json.loads(body_str)
        
        execution_id = data.get("execution_id", "")
        state = data.get("state", "")
        message = data.get("message", "")
        
        if not execution_id:
            logger.warning("Missing execution_id in execution update")
            return {"status": "error", "message": "Missing execution_id"}
        
        logger.info(f"📡 Execution Update: {execution_id} -> {state}")
        
        if execution_id in manager.execution_status:
            manager.execution_status[execution_id]["state"] = state
        else:
            manager.execution_status[execution_id] = {
                "execution_id": execution_id,
                "state": state,
                "tasks": {},
                "logs": []
            }
        
        await manager.broadcast_update(execution_id, {
            "type": "execution_update",
            "execution_id": execution_id,
            "state": state,
            "message": message
        })
        
        return {"status": "received", "state": state}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in execution update: {e}")
        return {"status": "error", "message": f"Invalid JSON: {str(e)}"}
    except Exception as e:
        logger.exception(f"Execution update error: {e}")
        return {"status": "error", "message": str(e)}


@webhook_router.get("/status/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get current status of an execution from the WebSocket manager."""
    status = manager.get_status(execution_id)
    if status:
        return status
    return {"execution_id": execution_id, "state": "UNKNOWN", "tasks": {}}


@webhook_router.get("/health")
async def webhook_health():
    """Health check endpoint for webhook service."""
    return {"status": "ok", "message": "Webhook service is running"}


@webhook_router.post("/test")
async def webhook_test(request: Request):
    """
    Test endpoint to verify Kestra can reach the backend.
    Logs the received payload without validation.
    """
    try:
        body = await request.body()
        body_str = body.decode('utf-8', errors='ignore')
        logger.info(f"🧪 TEST WEBHOOK RECEIVED: {body_str}")
        
        return {
            "status": "success",
            "message": "Test webhook received successfully",
            "received_length": len(body_str),
            "preview": body_str[:200] if body_str else "empty"
        }
    except Exception as e:
        logger.exception(f"Test webhook error: {e}")
        return {"status": "error", "message": str(e)}
