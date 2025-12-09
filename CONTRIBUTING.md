# Contributing to RedLoop

First off, thank you for considering contributing to RedLoop! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

---

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

---

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/haroon0x/RedLoop/issues)
- If not, create a new issue with:
  - Clear, descriptive title
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details (OS, Python version, etc.)

### 💡 Suggesting Features

- Open an issue with the `enhancement` label
- Describe the feature and its use case
- Explain why it would be valuable

### 🔧 Code Contributions

1. Look for issues labeled `good first issue` or `help wanted`
2. Comment on the issue to let others know you're working on it
3. Fork, code, and submit a PR!

---

## 🛠️ Development Setup

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager
- Node.js 18+ (for frontend)
- Git

### Backend Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/RedLoop.git
cd RedLoop

# Set up backend
cd backend
uv sync

# Run development server
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Pre-commit Hooks (Recommended)

```bash
# Install pre-commit
pip install pre-commit

# Set up hooks
pre-commit install
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our [style guidelines](#style-guidelines)

3. **Test your changes**:
   ```bash
   cd backend && uv run pytest
   ```

4. **Commit with clear messages** (see [Commit Messages](#commit-messages))

### Submitting

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request against `main`

3. Fill out the PR template:
   - Describe what changes you made
   - Reference any related issues
   - Add screenshots if applicable

4. Wait for **CodeRabbit** AI review and address feedback

5. Request review from maintainers

### After Submitting

- Respond to review feedback promptly
- Make requested changes in new commits
- Be patient - we review PRs as quickly as we can!

---

## 🎨 Style Guidelines

### Python

- Follow [PEP 8](https://pep8.org/)
- Use type hints for function signatures
- Use docstrings for public functions/classes
- Maximum line length: 100 characters

```python
# ✅ Good
def analyze_code(code: str, filename: str = "unknown.py") -> list[Vulnerability]:
    """
    Analyze code for security vulnerabilities.
    
    Args:
        code: Source code to analyze
        filename: Optional filename for context
        
    Returns:
        List of detected vulnerabilities
    """
    pass

# ❌ Bad
def analyze(c, f=None):
    pass
```

### TypeScript/JavaScript

- Use TypeScript for new frontend code
- Follow ESLint configuration
- Use meaningful variable names

### Documentation

- Update README if adding new features
- Add docstrings to new functions
- Include usage examples where helpful

---

## 📝 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
git commit -m "feat(api): add GitHub URL scanning endpoint"

# Bug fix
git commit -m "fix(adversary): handle empty code input gracefully"

# Documentation
git commit -m "docs(readme): add API usage examples"

# Refactor
git commit -m "refactor(core): extract vulnerability parsing to separate module"
```

---

## 🏷️ Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `documentation` | Docs improvements |
| `priority: high` | Urgent issues |

---

## ❓ Questions?

- Open a [Discussion](https://github.com/haroon0x/RedLoop/discussions)
- Check existing issues and PRs
- Reach out to maintainers

---

Thank you for contributing to RedLoop! 🔴🔵
