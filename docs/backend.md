# 🔴 RedLoop Backend - Implementation Plan

> Priority-ordered roadmap for backend features

---

## 📊 Priority Matrix

| Priority | Feature | Prize Target | Time | Day | Status |
|----------|---------|--------------|------|-----|--------|
| 🔴 P0 | GitHub URL (public repos) | Cline $5K | 3h | 1 | ⬜ |
| 🔴 P0 | Code Paste (textarea input) | Cline $5K | 1h | 1 | ⬜ |
| 🔴 P0 | Results API (vulnerabilities) | - | 2h | 1 | ⬜ |
| **� P0** | **Kestra AI Agent Integration** | **Kestra $4K** | **4h** | **2** | ⬜ |
| �🟡 P1 | File Upload (single files) | - | 2h | 2 | ⬜ |
| 🟡 P1 | ZIP Upload (full project) | - | 1h | 2 | ⬜ |
| 🟡 P1 | GitHub OAuth (private repos) | - | 3h | 3 | ⬜ |
| 🔴 P0 | CLI Tool | Cline $5K | 3h | 4 | ⬜ |
| 🟢 P2 | Scan History (database) | - | 2h | 4 | ⬜ |
| 🔴 P0 | Vercel Deployment | Vercel $2K | 1h | 5 | ⬜ |

### 🏆 Prize Alignment

| Prize | Amount | Required Tech | Our Implementation |
|-------|--------|---------------|-------------------|
| Infinity Build | $5,000 | Cline CLI | CLI tool + autonomous scanning |
| Wakanda Data | $4,000 | Kestra AI Agent | Summarize vulns + BLOCK/PASS decision |
| Stormbreaker | $2,000 | Vercel Deploy | Dashboard + API on Vercel |
| Captain Code | $1,000 | CodeRabbit | PR reviews visible in repo |

---

## 🏗️ Architecture: Adaptive Fallback (Cline → Kestra AI Agent)

> **Strategy:** Try Cline CLI first (for $5K prize eligibility), automatically fall back to Kestra AI Agent if Cline fails (still eligible for $4K prize).

### 🎯 Prize Eligibility Summary

| Scenario | What Happens | Best Prize Eligible |
|----------|--------------|---------------------|
| Cline works | Adversary/Defender use Cline, Summarizer uses Kestra AI | Cline $5K or Kestra $4K |
| Cline fails | All agents use Kestra AI Agent | Kestra $4K |
| Always | Summarizer is Kestra AI Agent | Kestra $4K guaranteed |

---

### 🔄 Adaptive 3-Agent Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REDLOOP - ADAPTIVE AGENT ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User Input (GitHub URL / Code / CLI)                                   │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  KESTRA WORKFLOW (Orchestrator)                                 │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │                                                                 │   │
│  │  Step 1: Clone repo / Receive code                              │   │
│  │         │                                                       │   │
│  │         ▼                                                       │   │
│  │  ┌───────────────────────────────────────────────────────┐     │   │
│  │  │  🔴 ADVERSARY AGENT                                   │     │   │
│  │  │  ─────────────────────────────────────────────────────│     │   │
│  │  │  TRY: Cline CLI (for $5K eligibility)                 │     │   │
│  │  │       cline -y -F json -f prompts/adversary.md        │     │   │
│  │  │            │                                          │     │   │
│  │  │            ▼                                          │     │   │
│  │  │       ┌─────────┐     ┌──────────────────────────┐   │     │   │
│  │  │       │ Works?  │ No  │ FALLBACK: Kestra AI Agent│   │     │   │
│  │  │       │         │────▶│ io.kestra.plugin.ai.     │   │     │   │
│  │  │       └────┬────┘     │ agent.AIAgent            │   │     │   │
│  │  │            │ Yes      └──────────────────────────┘   │     │   │
│  │  │            ▼                                          │     │   │
│  │  │       Use Cline output                                │     │   │
│  │  └───────────────────────────────────────────────────────┘     │   │
│  │         │                                                       │   │
│  │         ▼                                                       │   │
│  │  ┌───────────────────────────────────────────────────────┐     │   │
│  │  │  🤖 SUMMARIZER AGENT (Always Kestra AI Agent)         │     │   │
│  │  │  ─────────────────────────────────────────────────────│     │   │
│  │  │  io.kestra.plugin.ai.agent.AIAgent ← WINS $4K!        │     │   │
│  │  │  - Summarizes vulnerability data                      │     │   │
│  │  │  - Calculates risk score (1-10)                       │     │   │
│  │  │  - Makes BLOCK/PASS decision (bonus credit!)          │     │   │
│  │  └───────────────────────────────────────────────────────┘     │   │
│  │         │                                                       │   │
│  │         ▼ (if BLOCK decision)                                   │   │
│  │  ┌───────────────────────────────────────────────────────┐     │   │
│  │  │  🔵 DEFENDER AGENT                                    │     │   │
│  │  │  ─────────────────────────────────────────────────────│     │   │
│  │  │  TRY: Cline CLI → FALLBACK: Kestra AI Agent           │     │   │
│  │  └───────────────────────────────────────────────────────┘     │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  PLUS: RedLoop CLI (built with Typer)                                   │
│  ─────────────────────────────────────────────────────────────────────  │
│  $ redloop scan .                 # Triggers Kestra workflow            │
│  $ redloop scan ./src --fix       # Auto-fix mode                       │
│  $ redloop scan . --local         # Bypass Kestra, direct scan          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🏆 Agent Configuration

| Agent | Primary | Fallback | Prize |
|-------|---------|----------|-------|
| 🔴 **Adversary** | Cline CLI | Kestra AI Agent | Cline $5K / Kestra $4K |
| 🤖 **Summarizer** | Kestra AI Agent | - (always Kestra) | Kestra $4K ✅ |
| 🔵 **Defender** | Cline CLI | Kestra AI Agent | Cline $5K / Kestra $4K |

**Key Insight:** The Summarizer is ALWAYS a Kestra AI Agent, guaranteeing eligibility for the $4K Kestra prize regardless of whether Cline works.

---

### 📜 Kestra Workflow: `redloop-adaptive.yml`

```yaml
id: redloop-adaptive
namespace: redloop
description: "🔴 RedLoop - Cline first, Kestra AI Agent fallback"

inputs:
  - id: github_url
    type: STRING
    description: "GitHub repository URL to scan"
    required: false
  - id: code
    type: STRING
    description: "Direct code to scan"
    required: false
  - id: branch
    type: STRING
    defaults: main

tasks:
  # Step 0: Check if Cline is available
  - id: check_cline
    type: io.kestra.plugin.scripts.shell.Commands
    commands:
      - which cline && echo "AVAILABLE" || echo "NOT_AVAILABLE"
    allowFailure: true

  # Step 1: Clone repository (if GitHub URL provided)
  - id: clone_repo
    type: io.kestra.plugin.git.Clone
    url: "{{ inputs.github_url }}"
    branch: "{{ inputs.branch }}"
    disabled: "{{ inputs.github_url == null }}"

  # ─────────────────────────────────────────────────────────────
  # 🔴 ADVERSARY AGENT (Try Cline, fallback to Kestra AI)
  # ─────────────────────────────────────────────────────────────
  
  - id: adversary_cline
    type: io.kestra.plugin.scripts.shell.Commands
    disabled: "{{ outputs.check_cline.stdout contains 'NOT_AVAILABLE' }}"
    allowFailure: true
    commands:
      - |
        cline -y -o -F json \
          -f prompts/adversary.md \
          -f data/attack_vectors.json \
          "Analyze this code for security vulnerabilities:
          {{ inputs.code ?? read(outputs.clone_repo.directory ~ '/src/**/*.py') }}"

  - id: adversary_kestra
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Fallback: Kestra AI Agent for vulnerability scanning"
    disabled: "{{ outputs.adversary_cline.exitCode == 0 }}"
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      modelName: gemini-2.5-flash
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
    systemPrompt: |
      You are ADVERSARY, an elite penetration tester.
      Analyze code for security vulnerabilities.
      Focus on: SQL Injection, XSS, Command Injection, Path Traversal.
      
      Output JSON:
      {
        "vulnerabilities": [
          {"id": "VULN-001", "type": "...", "severity": "CRITICAL|HIGH|MEDIUM|LOW", 
           "file": "...", "line": 42, "description": "...", "payload": "...", "fix_suggestion": "..."}
        ]
      }
    prompt: |
      Analyze this code for security vulnerabilities:
      {{ inputs.code ?? 'Code from repository' }}

  # Merge adversary outputs
  - id: adversary_result
    type: io.kestra.plugin.core.debug.Return
    format: "{{ outputs.adversary_cline.stdout ?? outputs.adversary_kestra.output }}"

  # ─────────────────────────────────────────────────────────────
  # 🤖 SUMMARIZER AGENT (Always Kestra AI Agent - FOR $4K PRIZE!)
  # ─────────────────────────────────────────────────────────────
  
  - id: summarizer
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Summarize vulnerabilities and make BLOCK/PASS decision"
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      modelName: gemini-2.5-flash
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
    prompt: |
      You are a Security Analyst. Analyze the vulnerability scan results and provide:
      
      1. Executive Summary (2-3 sentences)
      2. Risk Score (1-10)
      3. Decision: "BLOCK" if any CRITICAL or HIGH severity, otherwise "PASS"
      4. Top 3 priority fixes
      
      VULNERABILITY DATA:
      {{ outputs.adversary_result.value }}
      
      Output as JSON:
      {
        "summary": "Brief executive summary",
        "risk_score": 7,
        "decision": "BLOCK",
        "total_vulnerabilities": 5,
        "critical_count": 2,
        "high_count": 1,
        "medium_count": 2,
        "low_count": 0,
        "priority_fixes": ["Fix 1", "Fix 2", "Fix 3"]
      }

  # ─────────────────────────────────────────────────────────────
  # Decision Gate: BLOCK or PASS?
  # ─────────────────────────────────────────────────────────────
  
  - id: decision_gate
    type: io.kestra.plugin.core.flow.If
    condition: "{{ json(outputs.summarizer.output).decision == 'BLOCK' }}"
    then:
      # ─────────────────────────────────────────────────────────
      # 🔵 DEFENDER AGENT (Try Cline, fallback to Kestra AI)
      # ─────────────────────────────────────────────────────────
      
      - id: defender_cline
        type: io.kestra.plugin.scripts.shell.Commands
        disabled: "{{ outputs.check_cline.stdout contains 'NOT_AVAILABLE' }}"
        allowFailure: true
        commands:
          - |
            cline -y -o -F json \
              -f prompts/defender.md \
              "Fix these vulnerabilities: {{ outputs.adversary_result.value }}"

      - id: defender_kestra
        type: io.kestra.plugin.ai.agent.AIAgent
        description: "Fallback: Kestra AI Agent for fix generation"
        disabled: "{{ outputs.defender_cline.exitCode == 0 }}"
        provider:
          type: io.kestra.plugin.ai.provider.GoogleGemini
          modelName: gemini-2.5-flash
          apiKey: "{{ secret('GEMINI_API_KEY') }}"
        systemPrompt: |
          You are DEFENDER, a security engineer.
          Generate secure code fixes for vulnerabilities.
          Use best practices: parameterized queries, input validation, output encoding.
        prompt: |
          Fix these vulnerabilities:
          {{ outputs.adversary_result.value }}
          
          Output JSON:
          {
            "fixes": [
              {"vulnerability_id": "VULN-001", "file": "...", 
               "original_code": "...", "fixed_code": "...", "explanation": "..."}
            ]
          }

      - id: defender_result
        type: io.kestra.plugin.core.debug.Return
        format: "{{ outputs.defender_cline.stdout ?? outputs.defender_kestra.output }}"

  # ─────────────────────────────────────────────────────────────
  # Final Output
  # ─────────────────────────────────────────────────────────────
  
  - id: final_output
    type: io.kestra.plugin.core.debug.Return
    format: |
      {
        "scan_summary": {{ outputs.summarizer.output }},
        "vulnerabilities": {{ outputs.adversary_result.value }},
        "fixes": {{ outputs.defender_result.value ?? 'null' }},
        "execution_id": "{{ execution.id }}",
        "agents_used": {
          "adversary": "{{ outputs.adversary_cline.exitCode == 0 ? 'cline' : 'kestra_ai' }}",
          "summarizer": "kestra_ai",
          "defender": "{{ outputs.defender_cline.exitCode == 0 ? 'cline' : 'kestra_ai' }}"
        }
      }

triggers:
  # Webhook for API integration
  - id: api_webhook
    type: io.kestra.plugin.core.trigger.Webhook
    key: "{{ secret('REDLOOP_WEBHOOK_SECRET') }}"
```

---

### 💻 Python Fallback Implementation

```python
# core/agents.py
import subprocess
import shutil
import os
from typing import Optional

def is_cline_available() -> bool:
    """Check if Cline CLI is installed and working."""
    if os.name == 'nt':  # Windows
        return False  # Cline doesn't support Windows
    return shutil.which("cline") is not None

async def run_adversary(code: str, use_kestra_fallback: bool = True) -> dict:
    """
    Run adversary agent.
    Try Cline first, fallback to Kestra AI Agent or direct Gemini.
    """
    
    if is_cline_available():
        try:
            result = subprocess.run(
                ["cline", "-y", "-o", "-F", "json",
                 "-f", "prompts/adversary.md",
                 "-f", "data/attack_vectors.json",
                 f"Analyze this code for vulnerabilities: {code[:5000]}"],  # Truncate for CLI
                capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode == 0:
                return {
                    "source": "cline",
                    "output": result.stdout,
                    "prize_eligible": "cline_5k"
                }
        except Exception as e:
            print(f"⚠️ Cline failed: {e}")
    
    # Fallback: Direct Gemini API call (simulates Kestra AI Agent)
    from .gemini import call_gemini
    output = await call_gemini(
        system_prompt=open("prompts/adversary.md").read(),
        user_prompt=f"Analyze this code for vulnerabilities:\n{code}"
    )
    return {
        "source": "kestra_ai_agent",
        "output": output,
        "prize_eligible": "kestra_4k"
    }

async def run_summarizer(vulnerability_data: str) -> dict:
    """
    Run summarizer agent.
    ALWAYS uses Kestra AI Agent (or Gemini) to guarantee $4K prize eligibility.
    """
    from .gemini import call_gemini
    
    output = await call_gemini(
        system_prompt="You are a Security Analyst. Summarize vulnerabilities and make BLOCK/PASS decision.",
        user_prompt=f"""
        Analyze these vulnerabilities and provide:
        1. Executive Summary
        2. Risk Score (1-10)
        3. Decision: BLOCK or PASS
        
        Data: {vulnerability_data}
        
        Output JSON with: summary, risk_score, decision, priority_fixes
        """
    )
    return {
        "source": "kestra_ai_agent",
        "output": output,
        "prize_eligible": "kestra_4k"
    }
```

---

### 🆚 Comparison: Old vs New

| Aspect | Old (Two Options) | New (Adaptive Fallback) |
|--------|-------------------|-------------------------|
| Architecture | Choose A or B | Single unified approach |
| Cline fails | Use Option B | Automatic fallback |
| Prize guarantee | Depends on choice | Kestra $4K always eligible |
| Complexity | Two workflows | One workflow |
| Windows | Only Option B | Automatic Kestra fallback |

---

### 📁 File Structure (Both Options)

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── api/
│   │   ├── routes.py        # All endpoints (direct + Kestra)
│   │   └── auth.py          # GitHub OAuth routes
│   └── models/
│       └── schemas.py       # Pydantic models
├── core/
│   ├── scanner.py           # File discovery + orchestration
│   ├── adversary.py         # Red team logic (Gemini API fallback)
│   ├── defender.py          # Blue team fix logic
│   ├── github.py            # GitHub clone/API utilities
│   ├── kestra.py            # Kestra API client
│   └── cline.py             # Cline CLI wrapper (Option A only)
├── cli/
│   ├── main.py              # Typer CLI app (redloop command)
│   └── display.py           # Rich output formatting
├── kestra/
│   └── flows/
│       ├── redloop-hybrid.yml    # Option A workflow
│       └── redloop-pure.yml      # Option B workflow
└── pyproject.toml
```

---

## 🔴 P0: Day 1 - Core Scanning

### 1. GitHub URL Scanning (Public Repos)

**Endpoint:** `POST /api/scan`

```python
# Request
{
    "github_url": "https://github.com/user/repo",
    "branch": "main"  # optional
}

# Response
{
    "scan_id": "uuid",
    "repo": "user/repo",
    "vulnerabilities": [...],
    "count": 5,
    "scan_time_ms": 1234
}
```

**Implementation:**
1. Validate GitHub URL format
2. `git clone --depth 1 --branch {branch} {url}` to temp dir
3. Discover files (`.py`, `.js`, `.ts`, `.tsx`, `.java`, `.go`)
4. Skip `node_modules`, `.venv`, `__pycache__`, `.git`
5. Send to Gemini for analysis
6. Parse response into `Vulnerability` objects
7. Cleanup temp directory
8. Return results

---

### 2. Code Paste Scanning

**Endpoint:** `POST /api/scan`

```python
# Request
{
    "code": "def login(user, pw):\n    query = f\"SELECT * FROM users WHERE u='{user}'\"",
    "filename": "auth.py"  # optional, helps with context
}

# Response
{
    "vulnerabilities": [...],
    "count": 1
}
```

**Implementation:**
1. Receive code string directly
2. No file system needed
3. Send to Gemini with filename hint
4. Return vulnerabilities

---

### 3. Results API

**Endpoint:** `GET /api/scan/{scan_id}` (if storing results)

For MVP, results are returned immediately in the scan response.

---

## � P0: Day 2 - Kestra AI Agent Integration

> **Prize Target:** Wakanda Data Award ($4,000)
> **Requirement:** Use Kestra's AI Agent to summarize data + make decisions

### Why Kestra?

Kestra AI Agents (`io.kestra.plugin.ai.agent.AIAgent`) are **autonomous decision engines** that:
- Combine LLMs with **tools** (code execution, API calls, flow triggers)
- Maintain **memory** for context
- Can **orchestrate other Kestra flows**
- Support **multi-agent architectures** (Adversary vs Defender!)

### RedLoop Kestra Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  KESTRA WORKFLOW: redloop-security-scan                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input: GitHub URL or Code                                              │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔴 ADVERSARY AGENT (io.kestra.plugin.ai.agent.AIAgent)         │   │
│  │  ───────────────────────────────────────────────────────────────│   │
│  │  - System Prompt: prompts/adversary.md                          │   │
│  │  - Tools: Python code execution, file reading                   │   │
│  │  - Task: Find vulnerabilities, generate payloads                │   │
│  │  - Output: List of vulnerabilities as JSON                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🤖 SUMMARIZER AGENT (Required for Wakanda Prize!)              │   │
│  │  ───────────────────────────────────────────────────────────────│   │
│  │  - Summarize vulnerability data from Adversary                  │   │
│  │  - Calculate risk score                                         │   │
│  │  - Make BLOCK/PASS decision                                     │   │
│  │  - Output: Executive summary + decision                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         │                                                               │
│         ▼                                                               │
│  ┌───────────────┐     ┌───────────────┐                               │
│  │ Decision:     │ Yes │ 🔵 DEFENDER   │                               │
│  │ BLOCK?        │────▶│    AGENT      │                               │
│  └───────────────┘     │ Generate fixes│                               │
│         │ No           └───────────────┘                               │
│         ▼                                                               │
│  Return: Clean / Vulnerabilities + Fixes                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Kestra Workflow: `redloop-security-scan.yml`

```yaml
id: redloop-security-scan
namespace: redloop
description: "🔴 RedLoop Adversarial Security Scanner with AI Agents"

inputs:
  - id: github_url
    type: STRING
    description: "GitHub repository URL to scan"
    required: false
  - id: code
    type: STRING
    description: "Direct code to scan"
    required: false
  - id: branch
    type: STRING
    defaults: main

tasks:
  # Step 1: Clone repository (if GitHub URL provided)
  - id: clone_repo
    type: io.kestra.plugin.git.Clone
    url: "{{ inputs.github_url }}"
    branch: "{{ inputs.branch }}"
    disabled: "{{ inputs.github_url == null }}"

  # Step 2: 🔴 ADVERSARY AGENT - Attack the code
  - id: adversary_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Red Team - Find vulnerabilities"
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      modelName: gemini-2.5-flash
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
    systemPrompt: |
      You are ADVERSARY, an elite penetration tester.
      Analyze code for security vulnerabilities.
      Focus on: SQL Injection, XSS, Command Injection, Path Traversal, Prompt Injection.
      
      For each vulnerability found, output JSON:
      {
        "vulnerabilities": [
          {
            "id": "VULN-001",
            "type": "SQL Injection",
            "severity": "CRITICAL",
            "file": "filename.py",
            "line": 42,
            "description": "User input directly concatenated in SQL",
            "payload": "' OR '1'='1",
            "fix_suggestion": "Use parameterized queries"
          }
        ]
      }
    prompt: |
      Analyze this code for security vulnerabilities:
      
      {{ inputs.code ?? read(outputs.clone_repo.directory ~ '/**/*.py') }}
      
      Return ONLY valid JSON with vulnerabilities array.
    tools:
      - type: io.kestra.plugin.ai.tool.PythonExecution
        description: "Execute Python code to analyze files"

  # Step 3: 🤖 SUMMARIZER AGENT - Summarize & Decide (FOR WAKANDA PRIZE!)
  - id: summarizer_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Summarize vulnerabilities and make BLOCK/PASS decision"
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      modelName: gemini-2.5-flash
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
    prompt: |
      You are a Security Analyst. Summarize these vulnerabilities from the Adversary scan:
      
      {{ outputs.adversary_agent.output }}
      
      Provide:
      1. Executive Summary (2-3 sentences max)
      2. Risk Score (1-10)
      3. Decision: "BLOCK" if any CRITICAL/HIGH vulns, otherwise "PASS"
      4. Top 3 priority fixes
      
      Output as JSON:
      {
        "summary": "...",
        "risk_score": 7,
        "decision": "BLOCK",
        "total_vulnerabilities": 5,
        "critical_count": 2,
        "high_count": 1,
        "priority_fixes": ["Fix SQL injection in auth.py", "..."]
      }

  # Step 4: Decision gate
  - id: check_decision
    type: io.kestra.plugin.core.flow.If
    condition: "{{ json(outputs.summarizer_agent.output).decision == 'BLOCK' }}"
    then:
      # Step 5: 🔵 DEFENDER AGENT - Generate fixes
      - id: defender_agent
        type: io.kestra.plugin.ai.agent.AIAgent
        description: "Blue Team - Generate security fixes"
        provider:
          type: io.kestra.plugin.ai.provider.GoogleGemini
          modelName: gemini-2.5-flash
          apiKey: "{{ secret('GEMINI_API_KEY') }}"
        systemPrompt: |
          You are DEFENDER, a security engineer.
          Generate secure code fixes for vulnerabilities.
          Use best practices: parameterized queries, input validation, output encoding.
        prompt: |
          Fix these vulnerabilities:
          {{ outputs.adversary_agent.output }}
          
          For each vulnerability, provide:
          {
            "fixes": [
              {
                "vulnerability_id": "VULN-001",
                "file": "filename.py",
                "original_code": "...",
                "fixed_code": "...",
                "explanation": "..."
              }
            ]
          }
        tools:
          - type: io.kestra.plugin.ai.tool.PythonExecution

  # Step 6: Return final results
  - id: final_output
    type: io.kestra.plugin.core.debug.Return
    format: |
      {
        "scan_summary": {{ outputs.summarizer_agent.output }},
        "vulnerabilities": {{ outputs.adversary_agent.output }},
        "fixes": {{ outputs.defender_agent.output ?? '[]' }},
        "execution_id": "{{ execution.id }}"
      }

triggers:
  # Optional: Webhook trigger for GitHub integration
  - id: github_webhook
    type: io.kestra.plugin.core.trigger.Webhook
    key: "{{ secret('REDLOOP_WEBHOOK_SECRET') }}"
```

### FastAPI Integration with Kestra

```python
# core/kestra.py
import httpx
from typing import Optional

KESTRA_URL = "https://your-kestra.kestra.cloud"  # or local instance
KESTRA_API_KEY = os.getenv("KESTRA_API_KEY")

async def trigger_kestra_scan(
    github_url: Optional[str] = None,
    code: Optional[str] = None,
    branch: str = "main"
) -> dict:
    """Trigger Kestra workflow and return execution ID."""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{KESTRA_URL}/api/v1/executions/redloop/redloop-security-scan",
            headers={"Authorization": f"Bearer {KESTRA_API_KEY}"},
            json={
                "inputs": {
                    "github_url": github_url,
                    "code": code,
                    "branch": branch,
                }
            }
        )
        return response.json()

async def get_kestra_result(execution_id: str) -> dict:
    """Poll for Kestra execution result."""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{KESTRA_URL}/api/v1/executions/{execution_id}",
            headers={"Authorization": f"Bearer {KESTRA_API_KEY}"},
        )
        return response.json()
```

### API Endpoints for Kestra

```python
# api/routes.py

@router.post("/scan/kestra")
async def scan_with_kestra(request: ScanRequest):
    """Trigger Kestra AI Agent workflow for scanning."""
    execution = await trigger_kestra_scan(
        github_url=request.github_url,
        code=request.code,
    )
    return {"execution_id": execution["id"], "status": "RUNNING"}

@router.get("/scan/kestra/{execution_id}")
async def get_kestra_scan_result(execution_id: str):
    """Get result of Kestra scan execution."""
    result = await get_kestra_result(execution_id)
    return result
```

### Setup Kestra

1. **Kestra Cloud** (Recommended - Free tier available)
   - Sign up at https://kestra.io/cloud
   - Create namespace `redloop`
   - Add workflow from above YAML

2. **Self-hosted** (Docker)
   ```bash
   docker run -p 8080:8080 kestra/kestra:latest
   ```

3. **Required Secrets in Kestra**
   - `GEMINI_API_KEY` - Google Gemini API key
   - `REDLOOP_WEBHOOK_SECRET` - For GitHub webhooks (optional)

---

## �🟡 P1: Day 2 - File Upload

### 4. Single File Upload

**Endpoint:** `POST /api/scan/upload`

```python
# Request: multipart/form-data
# file: auth.py (binary)

# Response
{
    "vulnerabilities": [...],
    "filename": "auth.py"
}
```

**Implementation:**
1. Accept `UploadFile` via FastAPI
2. Read content as text
3. Scan using same logic as code paste
4. Return results

---

### 5. ZIP Upload

**Endpoint:** `POST /api/scan/upload`

```python
# Request: multipart/form-data
# file: project.zip (binary)

# Response
{
    "vulnerabilities": [...],
    "files_scanned": 42
}
```

**Implementation:**
1. Detect `.zip` extension
2. Extract to temp directory
3. Scan all files
4. Cleanup and return results

---

## 🟡 P1: Day 3 - GitHub OAuth

### 6. GitHub OAuth Flow

**Endpoints:**

```
GET  /api/auth/github          → Redirect to GitHub
GET  /api/auth/github/callback → Handle OAuth callback
GET  /api/auth/me              → Get current user
POST /api/auth/logout          → Clear session
```

**Environment Variables:**
```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=https://redloop.vercel.app/api/auth/github/callback
```

**Implementation:**
1. Redirect user to GitHub OAuth URL
2. GitHub redirects back with `?code=xxx`
3. Exchange code for access token
4. Store token in session/cookie
5. Use token for private repo cloning:
   ```
   https://{token}@github.com/user/private-repo.git
   ```

---

## 🔴 P0: Day 4 - CLI Tool

### 7. CLI Commands

```bash
# Scan current directory
redloop scan .

# Scan specific path
redloop scan ./src

# JSON output (for CI/CD)
redloop scan . --output json

# Auto-fix mode
redloop scan . --fix

# Filter by severity
redloop scan . --min-severity HIGH

# Initialize config
redloop init

# Configure API key
redloop auth
```

**Entry Point in `pyproject.toml`:**
```toml
[project.scripts]
redloop = "cli.main:app"
```

---

## 🟢 P2: Nice to Have

### 8. Scan History (Database)

Store scan results for later viewing:

```python
# models
class ScanRecord(BaseModel):
    id: str
    github_url: Optional[str]
    created_at: datetime
    vulnerabilities: List[Vulnerability]
    user_id: Optional[str]
```

Use Vercel Postgres (free tier) or SQLite for MVP.

---

## 📡 API Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | API status | ❌ |
| `GET` | `/api/health` | Health check | ❌ |
| `POST` | `/api/scan` | Scan code (URL/paste) | ❌ |
| `POST` | `/api/scan/upload` | Scan uploaded file/zip | ❌ |
| `POST` | `/api/fix` | Generate fixes | ❌ |
| `GET` | `/api/auth/github` | Start OAuth | ❌ |
| `GET` | `/api/auth/github/callback` | OAuth callback | ❌ |
| `GET` | `/api/auth/me` | Current user | ✅ |

---

## 🔧 Environment Variables

```env
# Required
GEMINI_API_KEY=your-gemini-api-key

# GitHub OAuth (optional, for private repos)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Server
HOST=0.0.0.0
PORT=8000
```

---

## 📦 Dependencies

```toml
[project]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn>=0.24.0",
    "pydantic>=2.5.0",
    "httpx>=0.25.0",           # HTTP client for Gemini API
    "python-multipart>=0.0.6", # File uploads
    "typer[all]>=0.9.0",       # CLI framework
    "rich>=13.0",              # CLI output formatting
    "gitpython>=3.1.0",        # Git operations (optional)
]
```

---

## ✅ Definition of Done

- [ ] All P0 features implemented
- [ ] API tested with curl/Postman
- [ ] Deployed to Vercel
- [ ] CLI installable via `uv tool install`
- [ ] Demo video recorded
- [ ] README updated with usage examples

---

## 🎥 Demo Script

1. Show web dashboard
2. Paste vulnerable code → instant results
3. Enter GitHub URL → scan full repo
4. Show CLI: `redloop scan .`
5. Show auto-fix generating patches
6. Show deployed Vercel URL

---

> **Next Step:** Implement GitHub URL scanning (P0, Day 1)
