from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .api.webhooks import webhook_router
from .core.websocket_manager import manager
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RedLoop API",
    description="Adversarial DevSecOps Autopilot Backend",
    version="0.1.0"
)

# Set ALLOWED_ORIGINS env var in production, e.g.: "https://redloop.vercel.app,https://your-custom-domain.com"
# In development, allow localhost origins. Use "*" for allow-all (not recommended for production).
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000,http://localhost:8080")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
logger.info(f"Configured CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(webhook_router, prefix="/webhook")

@app.get("/")
async def root():
    return {"message": "RedLoop Core Online", "docs": "/docs"}

@app.websocket("/ws/execution/{execution_id}")
async def websocket_endpoint(websocket: WebSocket, execution_id: str):
    """
    WebSocket endpoint for real-time execution updates.
    Frontend connects here to receive live task progress.
    """
    await manager.connect(websocket, execution_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, execution_id)
    except Exception:
        manager.disconnect(websocket, execution_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
