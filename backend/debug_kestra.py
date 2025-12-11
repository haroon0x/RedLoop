import asyncio
import httpx
import os

async def debug_kestra():
    base_url = os.getenv("KESTRA_URL", "http://kestra:8080")
    print(f"Connecting to Kestra at {base_url}")
    
    endpoints = [
        "/api/v1/health",
        "/api/v1/configs",
        "/api/v1/flows",
        "/api/v1/executions"
    ]
    
    async with httpx.AsyncClient() as client:
        # 1. No Auth
        print("\n--- Testing No Auth ---")
        for ep in endpoints:
            try:
                resp = await client.get(f"{base_url}{ep}")
                print(f"GET {ep}: {resp.status_code}")
                if resp.status_code == 401:
                    print(f"  Headers: {resp.headers}")
            except Exception as e:
                print(f"GET {ep} Error: {e}")

        # 2. Basic Auth (admin:admin)
        print("\n--- Testing Basic Auth (admin:admin) ---")
        async with httpx.AsyncClient(auth=("admin", "admin")) as client_auth:
            for ep in endpoints:
                try:
                    resp = await client_auth.get(f"{base_url}{ep}")
                    print(f"GET {ep}: {resp.status_code}")
                except Exception as e:
                    print(f"GET {ep} Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_kestra())
