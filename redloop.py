#!/usr/bin/env python3
"""
RedLoop - Zero-Cost Adversarial DevSecOps Autopilot
CLI entrypoint for security scanning and auto-remediation
"""

import argparse
import subprocess
import sys
import json
from pathlib import Path


def get_cline_path():
    """Check if cline CLI is available"""
    result = subprocess.run(["which", "cline"] if sys.platform != "win32" else ["where", "cline"], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Cline CLI not found. Install with: npm install -g cline")
        sys.exit(1)
    return result.stdout.strip().split('\n')[0]


def run_adversary(target_path: str, attack_vectors_path: str, adversary_prompt_path: str) -> dict:
    """Run the Adversary agent to find vulnerabilities"""
    
    # Collect files to analyze
    target = Path(target_path)
    if target.is_file():
        files = [target]
    else:
        files = list(target.rglob("*.py")) + list(target.rglob("*.js")) + list(target.rglob("*.ts"))
    
    if not files:
        print("⚠️ No Python/JS/TS files found to scan")
        return {"vulnerabilities": []}
    
    # Build the prompt
    code_content = ""
    for f in files[:10]:  # Limit to 10 files for context
        try:
            code_content += f"\n\n--- {f.name} ---\n"
            code_content += f.read_text(errors='ignore')
        except Exception as e:
            print(f"⚠️ Could not read {f}: {e}")
    
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
      "description": "Description of the vulnerability",
      "payload": "Specific exploit payload",
      "fix_suggestion": "How to fix it"
    }}
  ]
}}

CODE TO ANALYZE:
{code_content}
"""
    
    # Run Cline in YOLO mode with JSON output
    cmd = [
        "cline", "-y", "-o", "-F", "json",
        "-f", adversary_prompt_path,
        "-f", attack_vectors_path,
        prompt
    ]
    
    print("🔴 Running Adversary agent...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Adversary failed: {result.stderr}")
        return {"vulnerabilities": [], "error": result.stderr}
    
    # Try to parse JSON from output
    try:
        # Find JSON in output
        output = result.stdout
        start = output.find('{')
        end = output.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(output[start:end])
    except json.JSONDecodeError:
        pass
    
    return {"vulnerabilities": [], "raw_output": result.stdout}


def run_defender(vulnerabilities: dict, defender_prompt_path: str) -> dict:
    """Run the Defender agent to fix vulnerabilities"""
    
    if not vulnerabilities.get("vulnerabilities"):
        print("✅ No vulnerabilities to fix")
        return {"fixes": []}
    
    prompt = f"""Fix the following vulnerabilities in the codebase.

VULNERABILITIES TO FIX:
{json.dumps(vulnerabilities, indent=2)}

For each vulnerability:
1. Locate the file and line
2. Apply the secure fix
3. Report what you changed

Output as JSON:
{{
  "fixes": [
    {{
      "vulnerability_id": "VULN-001",
      "file": "filename.py",
      "status": "FIXED|SKIPPED",
      "changes": "Description of changes made"
    }}
  ]
}}
"""
    
    cmd = [
        "cline", "-y", "-o", "-F", "json",
        "-f", defender_prompt_path,
        prompt
    ]
    
    print("🔵 Running Defender agent...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Defender failed: {result.stderr}")
        return {"fixes": [], "error": result.stderr}
    
    try:
        output = result.stdout
        start = output.find('{')
        end = output.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(output[start:end])
    except json.JSONDecodeError:
        pass
    
    return {"fixes": [], "raw_output": result.stdout}


def cmd_scan(args):
    """Handle the 'scan' command"""
    base_path = Path(__file__).parent
    attack_vectors = base_path / "data" / "attack_vectors.json"
    adversary_prompt = base_path / "prompts" / "adversary.md"
    defender_prompt = base_path / "prompts" / "defender.md"
    
    # Check required files exist
    if not attack_vectors.exists():
        print(f"❌ Attack vectors not found: {attack_vectors}")
        sys.exit(1)
    if not adversary_prompt.exists():
        print(f"❌ Adversary prompt not found: {adversary_prompt}")
        sys.exit(1)
    
    target = args.path or "."
    print(f"🎯 Scanning: {target}")
    
    # Run Adversary
    vulns = run_adversary(target, str(attack_vectors), str(adversary_prompt))
    
    vuln_count = len(vulns.get("vulnerabilities", []))
    print(f"\n📊 Found {vuln_count} vulnerabilities")
    
    # Print summary
    for v in vulns.get("vulnerabilities", []):
        severity = v.get("severity", "UNKNOWN")
        emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}.get(severity, "⚪")
        print(f"  {emoji} [{severity}] {v.get('type', 'Unknown')} in {v.get('file', '?')}")
    
    # Save report
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(vulns, f, indent=2)
        print(f"\n📄 Report saved to: {args.output}")
    
    # Auto-fix if requested
    if args.fix and vuln_count > 0:
        if not defender_prompt.exists():
            print(f"❌ Defender prompt not found: {defender_prompt}")
            sys.exit(1)
        
        fixes = run_defender(vulns, str(defender_prompt))
        fix_count = len([f for f in fixes.get("fixes", []) if f.get("status") == "FIXED"])
        print(f"\n🔧 Fixed {fix_count}/{vuln_count} vulnerabilities")
    
    # Exit code for CI
    if args.fail_on:
        severities = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        threshold = severities.get(args.fail_on.upper(), 0)
        for v in vulns.get("vulnerabilities", []):
            if severities.get(v.get("severity", "").upper(), 0) >= threshold:
                print(f"\n❌ Failing due to {v.get('severity')} severity vulnerability")
                sys.exit(1)
    
    return vulns


def cmd_ci(args):
    """Handle the 'ci' command - scan only changed files"""
    # Get changed files from git
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD~1"],
        capture_output=True, text=True
    )
    
    if result.returncode != 0:
        print("❌ Failed to get git diff. Are you in a git repo?")
        sys.exit(1)
    
    changed_files = result.stdout.strip().split('\n')
    changed_files = [f for f in changed_files if f.endswith(('.py', '.js', '.ts'))]
    
    if not changed_files:
        print("✅ No code files changed")
        sys.exit(0)
    
    print(f"📝 Scanning {len(changed_files)} changed files")
    
    # Reuse scan logic
    args.path = " ".join(changed_files)
    return cmd_scan(args)


def main():
    parser = argparse.ArgumentParser(
        description="RedLoop - Zero-Cost Adversarial DevSecOps Autopilot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  redloop scan                     # Scan current directory
  redloop scan ./src --fix         # Scan and auto-fix
  redloop scan -o report.json      # Save report to file
  redloop ci --fail-on CRITICAL    # CI mode, fail on critical
"""
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Scan codebase for vulnerabilities")
    scan_parser.add_argument("path", nargs="?", default=".", help="Path to scan (default: .)")
    scan_parser.add_argument("--fix", action="store_true", help="Auto-fix vulnerabilities")
    scan_parser.add_argument("-o", "--output", help="Output report to file")
    scan_parser.add_argument("--fail-on", choices=["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                            help="Exit with error if severity >= threshold")
    
    # CI command
    ci_parser = subparsers.add_parser("ci", help="CI mode - scan changed files only")
    ci_parser.add_argument("--fix", action="store_true", help="Auto-fix vulnerabilities")
    ci_parser.add_argument("-o", "--output", help="Output report to file")
    ci_parser.add_argument("--fail-on", choices=["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                          help="Exit with error if severity >= threshold")
    
    args = parser.parse_args()
    
    if args.command == "scan":
        cmd_scan(args)
    elif args.command == "ci":
        cmd_ci(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
