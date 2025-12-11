from fastapi import WebSocket
from typing import Dict, Set

class ConnectionManager:
    """Manages WebSocket connections for execution streaming."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.execution_status: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, execution_id: str):
        """Accept a new WebSocket connection for an execution."""
        await websocket.accept()
        if execution_id not in self.active_connections:
            self.active_connections[execution_id] = set()
        self.active_connections[execution_id].add(websocket)
        
        if execution_id in self.execution_status:
            try:
                await websocket.send_json(self.execution_status[execution_id])
            except Exception as e:
                print(f"Error sending initial status: {e}")
    
    def disconnect(self, websocket: WebSocket, execution_id: str):
        """Remove a WebSocket connection."""
        if execution_id in self.active_connections:
            self.active_connections[execution_id].discard(websocket)
            if not self.active_connections[execution_id]:
                del self.active_connections[execution_id]
    
    async def broadcast_update(self, execution_id: str, data: dict):
        """Broadcast an update to all clients watching an execution."""
        if execution_id not in self.execution_status:
            self.execution_status[execution_id] = {
                "execution_id": execution_id,
                "state": "RUNNING",
                "tasks": {},
                "logs": []
            }
        
        if data.get("type") == "task_update":
            task_id = data.get("task_id", "")
            self.execution_status[execution_id]["tasks"][task_id] = {
                "status": data.get("status", ""),
                "message": data.get("message", "")
            }
        
        if execution_id not in self.active_connections:
            return
        
        disconnected = set()
        for websocket in self.active_connections[execution_id]:
            try:
                await websocket.send_json(data)
            except Exception:
                disconnected.add(websocket)
        
        for ws in disconnected:
            self.active_connections[execution_id].discard(ws)
    
    def get_status(self, execution_id: str) -> dict:
        return self.execution_status.get(execution_id, {})
    
    def update_task_status(self, execution_id: str, task_id: str, status: str, message: str = ""):
        """Update task status in the stored execution status."""
        # Ensure the execution_status structure exists with all required keys
        if execution_id not in self.execution_status:
            self.execution_status[execution_id] = {
                "execution_id": execution_id,
                "state": "RUNNING",
                "tasks": {},
                "logs": []
            }
        
        if "tasks" not in self.execution_status[execution_id]:
            self.execution_status[execution_id]["tasks"] = {}
        
        if "logs" not in self.execution_status[execution_id]:
            self.execution_status[execution_id]["logs"] = []
        
        self.execution_status[execution_id]["tasks"][task_id] = {
            "status": status,
            "message": message
        }
        
        self.execution_status[execution_id]["logs"].append({
            "task_id": task_id,
            "status": status,
            "message": message
        })

manager = ConnectionManager()
