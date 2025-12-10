import asyncio
import httpx

async def test_trigger():
    url = "http://localhost:8000/api/kestra/trigger"
    payload = {
        "repository_url": "https://github.com/kestra-io/scripts",
        "branch": "main"
    }
    
    print(f"Testing Trigger API at {url}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_trigger())
