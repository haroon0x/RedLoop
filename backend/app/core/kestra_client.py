import os
import httpx
from typing import Dict, Any, Optional

class KestraClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("KESTRA_URL", "http://kestra:8080")
        self.namespace = "redloop.security"
        self.flow_id = "redloop_orchestrator_v1"
        
    async def get_status(self) -> Dict[str, Any]:
        """Check if Kestra is reachable."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/v1/flows")
                if response.status_code == 200:
                    return {"status": "online", "flows": len(response.json())}
                # 401 means Kestra is running but auth is required - still "online"
                if response.status_code == 401:
                    return {"status": "online", "auth_required": True}
                return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "offline", "error": str(e)}

    async def trigger_flow(
        self, 
        repository_url: str, 
        branch: str = "main"
    ) -> Dict[str, Any]:
        """Trigger the RedLoop security scan workflow via Webhook."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Webhook URL: /api/v1/executions/webhook/{namespace}/{flowId}/{key}
                webhook_key = "redloop_secret"
                url = f"{self.base_url}/api/v1/executions/webhook/{self.namespace}/{self.flow_id}/{webhook_key}"
                
                # Kestra webhook expects inputs as query parameters
                params = {
                    "repository_url": repository_url,
                    "branch": branch
                }
                
                print(f"Triggering Webhook: {url} with params: {params}")
                response = await client.post(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "execution_id": data.get("id"),
                        "state": "CREATED", # Webhooks return execution details immediately
                        "namespace": self.namespace,
                        "flow_id": self.flow_id
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Failed to trigger flow: {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_execution_status(self, execution_id: str) -> Dict[str, Any]:
        """Get the status of a running execution."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.base_url}/api/v1/executions/{execution_id}"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    state = data.get("state", {})
                    
                    # Extract task outputs if available
                    outputs = {}
                    task_run_list = data.get("taskRunList", [])
                    for task in task_run_list:
                        task_id = task.get("taskId")
                        task_outputs = task.get("outputs", {})
                        if task_outputs:
                            outputs[task_id] = task_outputs
                    
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "state": state.get("current", "UNKNOWN"),
                        "start_date": data.get("state", {}).get("startDate"),
                        "end_date": data.get("state", {}).get("endDate"),
                        "duration": data.get("state", {}).get("duration"),
                        "task_count": len(task_run_list),
                        "outputs": outputs
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_execution_logs(self, execution_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get logs from a specific execution."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.base_url}/api/v1/logs/{execution_id}"
                params = {"minLevel": "INFO", "size": limit}
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    logs = response.json()
                    return {
                        "success": True,
                        "logs": [
                            {
                                "timestamp": log.get("timestamp"),
                                "level": log.get("level"),
                                "message": log.get("message"),
                                "task_id": log.get("taskId")
                            }
                            for log in logs
                        ]
                    }
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
