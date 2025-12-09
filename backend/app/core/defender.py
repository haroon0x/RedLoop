import json
import subprocess
from pathlib import Path
from typing import List
from ..models.schemas import Vulnerability, FixSuggestion

class DefenderAgent:
    def __init__(self, prompt_path: Path):
        self.prompt_path = prompt_path

    async def generate_fixes(self, vulnerabilities: List[Vulnerability]) -> List[FixSuggestion]:
        if not vulnerabilities:
            return []
            
        if not self.prompt_path.exists():
             raise FileNotFoundError(f"Defender prompt not found at {self.prompt_path}")

        vuln_data = [v.model_dump() for v in vulnerabilities]

        prompt = f"""Fix the following vulnerabilities.

VULNERABILITIES:
{json.dumps(vuln_data, indent=2)}

Output as JSON:
{{
  "fixes": [
    {{
      "vulnerability_id": "VULN-xxx",
      "file": "filename",
      "status": "FIXED|SKIPPED",
      "changes": "Description"
    }}
  ]
}}
"""

        cmd = [
            "cline", "-y", "-o", "-F", "json",
            "-f", str(self.prompt_path),
            prompt
        ]

        try:
            print(f"🔵 Running Defender...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"❌ Defender error: {result.stderr}")
                return []

            return self._parse_output(result.stdout)
            
        except Exception as e:
            print(f"❌ Execution failed: {e}")
            return []

    def _parse_output(self, output: str) -> List[FixSuggestion]:
        try:
            start = output.find('{')
            end = output.rfind('}') + 1
            if start != -1 and end > start:
                data = json.loads(output[start:end])
                fixes = []
                for f in data.get("fixes", []):
                    fixes.append(FixSuggestion(**f))
                return fixes
        except Exception:
            pass
        return []
