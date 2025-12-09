import subprocess
import sys
import shutil

class Utils:
    @staticmethod
    def get_cline_path() -> str:
        path = shutil.which("cline")
        if path:
            return path
            
        cmd = ["which", "cline"] if sys.platform != "win32" else ["where", "cline"]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip().split('\n')[0]
        except Exception:
            pass
            
        raise RuntimeError("Cline CLI not found. Install with: npm install -g cline")
