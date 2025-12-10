import httpx
import asyncio
import os

async def register_flow():
    # Read the flow content
    flow_path = "/app/kestra/flows/redloop_orchestrator_v1.yaml"
    # We are running inside backend container, so we need to access the file from the volume mount or copy it.
    # Ah, the backend container doesn't have the kestra/flows folder mounted.
    # I will paste the content here for simplicity or assume I run this on host with python but I can't.
    # Actually, I can run this via `uv run` on the backend container if I write the file content there.
    
    # Wait, I am writing this file to the HOST -> mounted to backend container /app/app...
    # NO, /app/app is read-only in docker-compose: ./backend/app:/app/app:ro
    # But I am writing `register_flow.py` to `backend/register_flow.py` which is NOT in `backend/app`.
    # It's in `backend/`. 
    # The build context is `./backend`, and dockerfile copies `.`.
    # BUT `docker-compose` mounts `./backend/app` to `/app/app`.
    # The `register_flow.py` will be in `/app/register_flow.py` if I rebuild, OR I can write it to the host and mount it?
    # No, I can just write it to `backend/register_flow.py` on the host. 
    # But the container is already running and I don't want to rebuild again if unnecessary.
    # I can just write a script that sends the content.
    
    flow_yaml = """
id: redloop_orchestrator_v1
namespace: redloop.security

description: |
  Hybrid RedLoop Security Assessment - Cline Primary + Kestra Fallback
  Uses Cline for deep penetration testing, falls back to Kestra AI Agent ONLY if Cline fails

labels:
  project: redloop
  type: security-scan
  version: v1

triggers:
  - id: webhook
    type: io.kestra.plugin.core.trigger.Webhook
    key: "redloop_secret"

inputs:
  - id: repository_url
    type: STRING
    description: "GitHub repository URL to analyze"
    defaults: "https://github.com/kestra-io/scripts"
  
  - id: branch
    type: STRING
    defaults: "main"
    description: "Branch to analyze"

tasks:
  - id: clone_and_scan
    type: io.kestra.plugin.core.flow.WorkingDirectory
    tasks:
      - id: clone_repository
        type: io.kestra.plugin.git.Clone
        url: "{{ inputs.repository_url }}"
        branch: "{{ inputs.branch }}"
        timeout: PT2M

      - id: read_code
        type: io.kestra.plugin.scripts.shell.Commands
        timeout: PT1M
        commands:
          - |
            for f in $(find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" \) | grep -v node_modules | grep -v .git | head -20); do
              echo "=== FILE: $f ==="
              head -200 "$f"
              echo ""
            done > code_content.txt
        outputFiles:
          - code_content.txt

      - id: cline_adversary
        type: io.kestra.plugin.scripts.shell.Commands
        allowFailure: true
        timeout: PT10M
        description: "Cline Adversary - Attacks codebase like a hacker"
        containerImage: node:20-slim
        env:
          GEMINI_API_KEY: "{{ secret('GEMINI_API_KEY') }}"
        beforeCommands:
          - npm install -g cline --silent 2>/dev/null || true
        commands:
          - |
            # Export API keys as environment variables for Cline
            export GEMINI_API_KEY="${GEMINI_API_KEY}"
            echo "GEMINI_API_KEY=${SECRET_GEMINI_API_KEY}" > .env
            
            # Check if cline is available
            if ! command -v cline &> /dev/null; then
              echo '{"status": "FAILED", "error": "CLINE_NOT_INSTALLED", "vulnerabilities": []}' > cline_output.txt
            else
              # Run Cline as adversary hacker
              cline -y "
              You are ADVERSARY - an elite hacker performing a penetration test.
              Read all code files and find vulnerabilities.
              Output ONLY valid JSON:
              {\\"status\\": \\"SUCCESS\\", \\"vulnerabilities\\": [{\\"id\\": \\"VULN-001\\", \\"type\\": \\"...\\", \\"severity\\": \\"CRITICAL\\", \\"file\\": \\"...\\", \\"fix\\": \\"...\\"}], \\"recommendation\\": \\"BLOCK\\"}
              " 2>&1 | tee cline_raw.txt || true
              
              # Try to extract JSON
              if grep -q '"vulnerabilities"' cline_raw.txt 2>/dev/null; then
                grep -o '{.*}' cline_raw.txt | tail -1 > cline_output.txt 2>/dev/null || echo '{"status": "FAILED", "error": "JSON_PARSE_ERROR", "vulnerabilities": []}' > cline_output.txt
              else
                echo '{"status": "FAILED", "error": "NO_VALID_OUTPUT", "vulnerabilities": [], "raw_output": "'"$(head -c 500 cline_raw.txt | tr '\\n' ' ')"'"}' > cline_output.txt
              fi
            fi
            
            cat cline_output.txt
        outputFiles:
          - cline_output.txt

  - id: adversary_kestra
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Kestra AI Agent - Vulnerability Scanner (runs if Cline failed or as validation)"
    timeout: PT5M
    retry:
      type: constant
      maxAttempt: 2
      interval: PT10S
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
      modelName: gemini-2.5-flash
    prompt: |
      Analyze the following code for security vulnerabilities:
      
      {{ read(outputs.read_code.outputFiles['code_content.txt']) }}
      
      Find: SQL injection, XSS, RCE, auth bypass, path traversal, hardcoded secrets.
      
      Output as JSON:
      {
        "vulnerabilities": [{"id": "VULN-001", "type": "...", "severity": "CRITICAL", "file": "...", "fix": "..."}],
        "summary": {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0},
        "recommendation": "BLOCK or PASS"
      }
    systemMessage: |
      You are ADVERSARY, a red team security researcher.
      Find vulnerabilities and be thorough.

  - id: summarizer_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Summarize and make BLOCK/PASS decision"
    timeout: PT3M
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
      modelName: gemini-2.5-flash
    prompt: |
      Analyze the vulnerability report and make a deployment decision:
      
      VULNERABILITY FINDINGS:
      {% if outputs.kestra_adversary_fallback is defined and outputs.kestra_adversary_fallback is not null %}
      {{ outputs.kestra_adversary_fallback.textOutput | default('No vulnerabilities found') }}
      {% else %}
      {{ read(outputs.cline_adversary.outputFiles['cline_output.txt']) }}
      {% endif %}
      
      Output JSON:
      {
        "summary": "2-3 sentence executive summary",
        "risk_score": 7,
        "decision": "BLOCK or PASS",
        "vulnerability_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0}
      }
      
      BLOCK if any CRITICAL or 3+ HIGH vulnerabilities, PASS otherwise.
    systemMessage: Be decisive. Always include BLOCK or PASS decision.

  - id: defender_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Generate security fixes"
    timeout: PT5M
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
      modelName: gemini-2.5-flash
    prompt: |
      Generate fixes for vulnerabilities:
      {{ outputs.summarizer_agent.textOutput }}
      
      Output JSON with fixes.
    systemMessage: Generate production-ready secure code fixes.

  - id: final_report
    type: io.kestra.plugin.ai.agent.AIAgent
    description: "Executive summary"
    timeout: PT3M
    provider:
      type: io.kestra.plugin.ai.provider.GoogleGemini
      apiKey: "{{ secret('GEMINI_API_KEY') }}"
      modelName: gemini-2.5-flash
    prompt: |
      Generate security report for {{ inputs.repository_url }}:
      Decision: {{ outputs.summarizer_agent.textOutput }}
      
      Create markdown: security posture, key findings, recommended actions.
    systemMessage: Be concise and actionable.

  - id: complete
    type: io.kestra.plugin.core.log.Log
    message: "RedLoop v1 Security Assessment Complete!"

errors:
  - id: error_handler
    type: io.kestra.plugin.core.log.Log
    message: "Flow failed. Check task logs."
"""

    url = "http://kestra:8080/api/v1/flows"
    print(f"Registering flow at {url}...")
    
    async with httpx.AsyncClient() as client:
        # We need to send the YAML content.
        # Kestra API expects the YAML as the body for POST /api/v1/flows
        try:
            resp = await client.post(
                url, 
                content=flow_yaml, 
                headers={"Content-Type": "application/x-yaml"}
            )
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(register_flow())
