# ⭕ RedLoop Backend

FastAPI-powered backend for RedLoop - the Adversarial DevSecOps Autopilot.

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── api/
│   │   └── routes.py     # API endpoint definitions
│   ├── core/
│   │   ├── adversary.py  # 🔴 Red Team agent logic
│   │   ├── defender.py   # 🔵 Blue Team agent logic
│   │   └── utils.py      # Utility functions
│   └── models/
│       └── schemas.py    # Pydantic request/response models
├── pyproject.toml        # Dependencies (managed by uv)
├── Dockerfile            # Container build
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager
- Node.js 20+ (for Cline CLI)

### Installation

```bash
# Navigate to backend
cd backend

# Install dependencies with uv
uv sync

# Run development server
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root - API status |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/scan` | Run adversarial security scan |
| `POST` | `/api/fix` | Generate fixes for vulnerabilities |

### Scan Code

```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"target_path": "./src", "auto_fix": false}'
```

**Response:**
```json
{
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "file": "auth.py",
      "line": 42,
      "severity": "CRITICAL",
      "type": "SQL Injection",
      "description": "User input directly concatenated in SQL query",
      "payload": "' OR '1'='1",
      "fix_suggestion": "Use parameterized queries"
    }
  ],
  "count": 1
}
```

### Fix Vulnerabilities

```bash
curl -X POST http://localhost:8000/api/fix \
  -H "Content-Type: application/json" \
  -d '{"vulnerabilities": [...]}'
```

**Response:**
```json
{
  "fixes": [
    {
      "vulnerability_id": "VULN-001",
      "file": "auth.py",
      "status": "FIXED",
      "changes": "Replaced string concatenation with parameterized query"
    }
  ],
  "count": 1
}
```

## 🐳 Docker

### Build

```bash
docker build -t redloop-backend .
```

### Run

```bash
docker run -p 8000:8000 redloop-backend
```

### With Docker Compose (from project root)

```bash
docker-compose up backend
```

## 🧪 Development

### Project Structure

- **`core/adversary.py`** - Red Team agent that analyzes code for vulnerabilities using LLM + attack vectors
- **`core/defender.py`** - Blue Team agent that generates fixes for detected vulnerabilities
- **`models/schemas.py`** - Pydantic models for type-safe request/response handling

### Adding Dependencies

```bash
uv add <package-name>
```

## 🔧 Configuration

Environment variables can be set in a `.env` file at the project root:

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |

## 📄 License

Apache 2.0 - See [LICENSE](../LICENSE)
