# Cline CLI Integration for RedLoop

## Overview

RedLoop uses **Cline CLI** to run autonomous security agents:
- **Adversary Agent**: Attacks code using YOLO mode
- **Defender Agent**: Fixes vulnerabilities automatically

## Installation

```bash
npm install -g cline
cline auth  # Configure Gemini or other provider
```

## YOLO Mode

We use `-y` (YOLO mode) for **fully autonomous execution**:
- No human approval prompts
- Auto-completes tasks
- Perfect for CI/CD pipelines

## Commands

### Adversary Agent (Red Team)
```bash
cline -y -F json \
  -f prompts/adversary.md \
  -f data/attack_vectors.json \
  "Analyze this code for vulnerabilities. Code: $(cat target_file.py)"
```

### Defender Agent (Blue Team)
```bash
cat vulnerability_report.json | cline -y -F json \
  -f prompts/defender.md \
  "Fix these vulnerabilities in the codebase"
```

## Key Flags

| Flag | Purpose |
|------|---------|
| `-y` / `--yolo` | Full autonomous mode, no prompts |
| `-F json` | JSON output for parsing |
| `-f FILE` | Attach file to context |
| `-o` / `--oneshot` | Complete task and exit |

## Context Injection

Files are attached directly using `-f`:
- `prompts/adversary.md` → System prompt (Red Team persona)
- `prompts/defender.md` → System prompt (Blue Team persona)  
- `data/attack_vectors.json` → 160+ attack patterns for context

**No RAG needed** - Cline handles file context automatically.

## Kestra Integration

```yaml
# In kestra workflow
- id: run_adversary
  type: io.kestra.core.tasks.scripts.Bash
  script: |
    cline -y -F json \
      -f prompts/adversary.md \
      -f data/attack_vectors.json \
      "Analyze: $(cat changed_files.txt)"
```

## Provider Configuration

```bash
# Launch interactive wizard to select provider
cline auth

# For Ollama, also set context window size
cline config s ollama-api-options-ctx-num=32768

# For LM Studio
cline config s lm-studio-max-tokens=32768
```

## Supported Providers

- Anthropic
- OpenAI
- OpenRouter
- Google Gemini
- Ollama
- X AI (Grok)
- AWS Bedrock
- Cerebras
