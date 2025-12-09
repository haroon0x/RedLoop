import subprocess
import sys
import shutil

class Utils:
    @staticmethod
    def get_cline_path() -> str:
        if sys.platform == "win32":
            raise RuntimeError(
                "Cline CLI is not supported on Windows. "
                "Please use Linux or macOS to run RedLoop."
            )
        
        path = shutil.which("cline")
        if path:
            return path
        
        try:
            result = subprocess.run(
                ["which", "cline"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except Exception:
            pass
            
        raise RuntimeError("Cline CLI not found. Install with: npm install -g cline")
