import os
import httpx
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator

# Configure module logger
logger = logging.getLogger(__name__)


class KestraClient:
    """Client for interacting with the Kestra API."""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.getenv("KESTRA_URL", "http://kestra:8080")
        self.namespace = "redloop.security"
        self.flow_id = "redloop_orchestrator_v1"
        # For Kestra OSS edition, tenant may not be needed in API paths
        # Set to empty string to use tenant-less endpoints
        self.tenant = ""  # Empty for OSS edition, "main" for Enterprise
        
        # Authentication - only used if Kestra security is enabled
        user = os.getenv("KESTRA_USER", "")
        password = os.getenv("KESTRA_PASSWORD", "")
        self.auth = (user, password) if user and password else None
        
        logger.info(f"KestraClient initialized: {self.base_url} (flow: {self.namespace}/{self.flow_id})")
        
    def _api_url(self, path: str) -> str:
        """Build API URL with optional tenant prefix."""
        if self.tenant:
            return f"{self.base_url}/api/v1/{self.tenant}{path}"
        else:
            return f"{self.base_url}/api/v1{path}"
        
    async def get_status(self) -> Dict[str, Any]:
        """
        Check if Kestra is online.
        
        API: GET /api/v1/configs (global endpoint, no tenant required)
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                response = await client.get(f"{self.base_url}/api/v1/configs")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "online",
                        "version": data.get("version"),
                        "edition": data.get("edition"),
                        "uuid": data.get("uuid")
                    }
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
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                webhook_key = "redloop_secret"
                url = f"{self.base_url}/api/v1/executions/webhook/{self.namespace}/{self.flow_id}/{webhook_key}"
                
                # Kestra webhooks access POST body via trigger.body
                body = {"repository_url": repository_url, "branch": branch}
                
                logger.info(f"Triggering Webhook: {url} with body: {body}")
                response = await client.post(url, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "execution_id": data.get("id"),
                        "state": "CREATED",
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
        """Get the current status of an execution."""
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    state = data.get("state", {})
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
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                url = self._api_url(f"/logs/{execution_id}")
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

    # =========================================================================
    # SSE Streaming - Real-time execution updates
    # =========================================================================
    
    async def stream_execution(self, execution_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream real-time execution updates via Server-Sent Events (SSE).
        
        Yields dictionaries containing execution state updates as they happen.
        Use this instead of polling for more efficient real-time updates.
        
        API: GET /api/v1/{tenant}/executions/{executionId}/follow
        """
        url = self._api_url(f"/executions/{execution_id}/follow")
        
        async with httpx.AsyncClient(timeout=None, auth=self.auth) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"Kestra Stream Error ({response.status_code}): {error_text.decode('utf-8', errors='ignore')}")
                    yield {"error": f"Failed to connect: {response.status_code}"}
                    return
                
                async for line in response.aiter_lines():
                    if not line or line.startswith(":"):
                        # Skip empty lines and SSE comments
                        continue
                    
                    if line.startswith("data:"):
                        try:
                            data = json.loads(line[5:].strip())
                            yield {
                                "type": "execution_update",
                                "execution_id": execution_id,
                                "state": data.get("state", {}).get("current"),
                                "task_run_list": data.get("taskRunList", []),
                                "outputs": data.get("outputs", {}),
                                "raw": data
                            }
                        except json.JSONDecodeError:
                            yield {"type": "raw", "data": line[5:].strip()}

    async def stream_logs(self, execution_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream real-time logs via Server-Sent Events (SSE).
        
        API: GET /api/v1/{tenant}/logs/{executionId}/follow
        """
        url = self._api_url(f"/logs/{execution_id}/follow")
        
        async with httpx.AsyncClient(timeout=None, auth=self.auth) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    yield {"error": f"Failed to connect: {response.status_code}"}
                    return
                
                async for line in response.aiter_lines():
                    if not line or line.startswith(":"):
                        continue
                    
                    if line.startswith("data:"):
                        try:
                            data = json.loads(line[5:].strip())
                            yield {
                                "type": "log",
                                "timestamp": data.get("timestamp"),
                                "level": data.get("level"),
                                "message": data.get("message"),
                                "task_id": data.get("taskId")
                            }
                        except json.JSONDecodeError:
                            yield {"type": "raw", "data": line[5:].strip()}

    # =========================================================================
    # Kill Execution - Stop a running scan
    # =========================================================================
    
    async def kill_execution(self, execution_id: str) -> Dict[str, Any]:
        """
        Kill/stop a running execution.
        
        API: DELETE /api/v1/{tenant}/executions/{executionId}/kill
        
        Returns:
            Dict with success status and message
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/kill")
                
                logger.info(f"Killing execution: {execution_id}")
                response = await client.delete(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "state": data.get("state", {}).get("current", "KILLED"),
                        "message": "Execution killed successfully"
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                elif response.status_code == 409:
                    return {"success": False, "error": "Execution already completed or cannot be killed"}
                else:
                    return {
                        "success": False, 
                        "error": f"Failed to kill execution: {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # Replay Execution - Re-run a previous scan
    # =========================================================================
    
    async def replay_execution(self, execution_id: str) -> Dict[str, Any]:
        """
        Replay/re-run a previous execution with the same inputs.
        
        API: POST /api/v1/{tenant}/executions/{executionId}/replay
        
        Returns:
            Dict with new execution_id if successful
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/replay")
                
                logger.info(f"Replaying execution: {execution_id}")
                response = await client.post(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "original_execution_id": execution_id,
                        "new_execution_id": data.get("id"),
                        "state": "CREATED",
                        "message": "Execution replay started"
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Original execution not found"}
                else:
                    return {
                        "success": False, 
                        "error": f"Failed to replay execution: {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # Restart Execution - Restart a failed execution from failure point
    # =========================================================================
    
    async def restart_execution(self, execution_id: str) -> Dict[str, Any]:
        """
        Restart a failed execution from the point of failure.
        
        API: POST /api/v1/{tenant}/executions/{executionId}/restart
        
        Returns:
            Dict with new execution_id if successful
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/restart")
                
                logger.info(f"Restarting execution: {execution_id}")
                response = await client.post(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "original_execution_id": execution_id,
                        "new_execution_id": data.get("id"),
                        "state": "CREATED",
                        "message": "Execution restarted from failure point"
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                elif response.status_code == 409:
                    return {"success": False, "error": "Execution is not in a failed state"}
                else:
                    return {
                        "success": False, 
                        "error": f"Failed to restart execution: {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # Get Flow Info - Get details about a specific flow
    # =========================================================================
    
    async def get_flow(self) -> Dict[str, Any]:
        """
        Get the RedLoop flow definition.
        
        API: GET /api/v1/{tenant}/flows/{namespace}/{id}
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                url = self._api_url(f"/flows/{self.namespace}/{self.flow_id}")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "id": data.get("id"),
                        "namespace": data.get("namespace"),
                        "description": data.get("description"),
                        "revision": data.get("revision"),
                        "disabled": data.get("disabled", False),
                        "inputs": data.get("inputs", []),
                        "tasks_count": len(data.get("tasks", []))
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Flow not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # File Download APIs - Download output files from executions
    # =========================================================================
    
    async def get_output_files_list(self, execution_id: str) -> Dict[str, Any]:
        """
        Get list of output files from an execution.
        
        API: GET /api/v1/{tenant}/executions/{executionId}/file/metas
        
        Returns list of available files with their paths and sizes.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/file/metas")
                response = await client.get(url)
                
                if response.status_code == 200:
                    files = response.json()
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "files": files
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def download_output_file(self, execution_id: str, file_path: str) -> Dict[str, Any]:
        """
        Download a specific output file from an execution.
        
        API: GET /api/v1/{tenant}/executions/{executionId}/file?path={filePath}
        
        Args:
            execution_id: The execution ID
            file_path: The internal Kestra file path (from file/metas response)
            
        Returns:
            Dict with file content or error
        """
        try:
            async with httpx.AsyncClient(timeout=60.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/file")
                params = {"path": file_path}
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    # Try to parse as JSON, fallback to raw text
                    content_type = response.headers.get("content-type", "")
                    if "application/json" in content_type:
                        try:
                            return {
                                "success": True,
                                "execution_id": execution_id,
                                "file_path": file_path,
                                "content_type": "json",
                                "content": response.json()
                            }
                        except:
                            pass
                    
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "file_path": file_path,
                        "content_type": "text",
                        "content": response.text
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "File not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def preview_output_file(self, execution_id: str, file_path: str, max_lines: int = 100) -> Dict[str, Any]:
        """
        Preview a file without downloading the whole thing.
        
        API: GET /api/v1/{tenant}/executions/{executionId}/file/preview
        
        Args:
            execution_id: The execution ID
            file_path: The internal Kestra file path
            max_lines: Maximum number of lines to preview
            
        Returns:
            Dict with file preview
        """
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                url = self._api_url(f"/executions/{execution_id}/file/preview")
                params = {"path": file_path, "maxLine": max_lines}
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "file_path": file_path,
                        "preview": response.text
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "File not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # Download Logs - Download full execution logs as file
    # =========================================================================
    
    async def download_logs(self, execution_id: str) -> Dict[str, Any]:
        """
        Download full execution logs as a text file.
        
        API: GET /api/v1/{tenant}/logs/{executionId}/download
        
        Returns complete log content suitable for saving as a file.
        """
        try:
            async with httpx.AsyncClient(timeout=60.0, auth=self.auth) as client:
                url = self._api_url(f"/logs/{execution_id}/download")
                response = await client.get(url)
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "content": response.text,
                        "content_type": response.headers.get("content-type", "text/plain"),
                        "size": len(response.text)
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =========================================================================
    # Execution Metrics - Performance and timing data
    # =========================================================================
    
    async def get_execution_metrics(self, execution_id: str) -> Dict[str, Any]:
        """
        Get metrics from an execution (duration, task timings, etc.)
        
        API: GET /api/v1/{tenant}/metrics/{executionId}
        
        Returns timing and performance data for the execution.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=self.auth) as client:
                url = self._api_url(f"/metrics/{execution_id}")
                response = await client.get(url)
                
                if response.status_code == 200:
                    metrics = response.json()
                    return {
                        "success": True,
                        "execution_id": execution_id,
                        "metrics": metrics
                    }
                elif response.status_code == 404:
                    return {"success": False, "error": "Execution not found"}
                else:
                    return {"success": False, "error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
