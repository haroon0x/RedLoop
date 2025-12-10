from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .api.webhooks import webhook_router
from .core.websocket_manager import manager

app = FastAPI(
    title="RedLoop API",
    description="Adversarial DevSecOps Autopilot Backend",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["redloop.vercel.app", "*"],
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
