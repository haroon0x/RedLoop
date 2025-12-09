# Contributing to RedLoop

Thank you for your interest in contributing to RedLoop! This document provides guidelines for contributing.

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) for Python dependency management
- [Cline CLI](https://github.com/cline/cline) for AI agent functionality

### Backend Setup
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Code Style

- **Python**: Follow PEP 8
- **TypeScript/React**: Follow ESLint configuration

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with a descriptive message
6. Push to your fork
7. Open a Pull Request

## Reporting Issues

Use GitHub Issues with these labels:
- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Docs improvement

## Questions?

Open a Discussion or reach out to the maintainers.
