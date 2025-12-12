from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional, Any
from ..core.websocket_manager import manager
import json

webhook_router = APIRouter(tags=["webhooks"])

class TaskUpdate(BaseModel):
    """Payload sent by Kestra when a task completes."""
    execution_id: str
    task_id: str
    status: str
    message: Optional[str] = ""
    data: Optional[Any] = None

class ExecutionUpdate(BaseModel):
    """Payload for overall execution state changes."""
    execution_id: str
    state: str
    message: Optional[str] = ""

@webhook_router.post("/task-update")
async def receive_task_update(request: Request):
    """
    Receive task completion notification from Kestra.
    Broadcasts the update to all connected WebSocket clients.
    """
    try:
        body = await request.body()
        print(f"📡 Raw webhook body: {body.decode('utf-8', errors='ignore')}")
        
        data = json.loads(body)
        execution_id = data.get("execution_id", "")
        task_id = data.get("task_id", "")
        status = data.get("status", "")
        message = data.get("message", "")
        
        print(f"📡 Task Update: {task_id} -> {status}")
        
        manager.update_task_status(execution_id, task_id, status, message)
        
        await manager.broadcast_update(execution_id, {
            "type": "task_update",
            "execution_id": execution_id,
            "task_id": task_id,
            "status": status,
            "message": message,
            "output": data.get("output"),
            "data": data.get("data")
        })
        
        return {"status": "received", "task_id": task_id}
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@webhook_router.post("/execution-update")
async def receive_execution_update(request: Request):
    """
    Receive execution state change from Kestra.
    Called when execution starts, completes, or fails.
    """
    try:
        body = await request.body()
        print(f"📡 Raw execution update: {body.decode('utf-8', errors='ignore')}")
        
        data = json.loads(body)
        execution_id = data.get("execution_id", "")
        state = data.get("state", "")
        message = data.get("message", "")
        
        print(f"📡 Execution Update: {execution_id} -> {state}")
        
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
    except Exception as e:
        print(f"❌ Execution update error: {e}")
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
    return {"status": "ok"}
