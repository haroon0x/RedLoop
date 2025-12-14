import json
import logging
import subprocess
from pathlib import Path
from typing import List
from ..models.schemas import Vulnerability

logger = logging.getLogger(__name__)

class AdversaryAgent:
    def __init__(self, attack_vectors_path: Path, prompt_path: Path):
        self.attack_vectors_path = attack_vectors_path
        self.prompt_path = prompt_path

    async def analyze_code(self, target_path: Path) -> List[Vulnerability]:
        if not self.attack_vectors_path.exists():
            raise FileNotFoundError(f"Attack vectors not found at {self.attack_vectors_path}")
        if not self.prompt_path.exists():
            raise FileNotFoundError(f"Adversary prompt not found at {self.prompt_path}")
            
        target = Path(target_path)
        if target.is_file():
            files = [target]
        else:
            files = list(target.rglob("*.py")) + list(target.rglob("*.js")) + list(target.rglob("*.ts")) + list(target.rglob("*.tsx"))
        
        files = [f for f in files if "node_modules" not in str(f) and ".venv" not in str(f)]

        if not files:
            return []

        code_content = ""
        for f in files[:10]:
            try:
                code_content += f"\n\n--- {f.name} ---\n"
                code_content += f.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass

        prompt = f"""Analyze this code for security vulnerabilities.
                Use the attack vectors from the attached file to identify specific exploits.
                Output your findings as JSON with this structure:
                {{
                  "vulnerabilities": [
                    {{
                      "id": "VULN-001",
                      "file": "filename.py",
                      "line": 42,
                      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
                      "type": "SQL Injection",
                      "description": "Description",
                      "payload": "Exploit payload",
                      "fix_suggestion": "Fix suggestion"
                    }}
                  ]
                }}
                
                CODE TO ANALYZE:
                {code_content}
                """

        cmd = [
            "cline", "-y", "-o", "-F", "json",
            "-f", str(self.prompt_path),
            "-f", str(self.attack_vectors_path),
            prompt
        ]

        try:
            logger.info(f"Running Adversary on {target_path}...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Adversary error: {result.stderr}")
                return []

            return self._parse_output(result.stdout)
            
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return []

    def _parse_output(self, output: str) -> List[Vulnerability]:
        try:
            start = output.find('{')
            end = output.rfind('}') + 1
            if start != -1 and end > start:
                data = json.loads(output[start:end])
                vulns = []
                for v in data.get("vulnerabilities", []):
                    vulns.append(Vulnerability(**v))
                return vulns
        except Exception as e:
            logger.error(f"JSON Parse error: {e}")
            pass
        return []
