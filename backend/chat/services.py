import subprocess
import time
import requests

class OllamaService:
    def __init__(self, base_url="http://localhost:11434", default_model="llama3.2:3b"):
        self.base_url = base_url
        self.default_model = default_model

    def is_running(self):
        try:
            response = requests.get(self.base_url, timeout=2)
            return response.status_code == 200
        except requests.RequestException:
            return False

    def ensure_running(self):
        if self.is_running():
            return True

        print("Ollama is not running. Starting 'ollama serve' in the background...")
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW  # Prevents a blank popup window on Windows
        )

        # Wait up to 10 seconds for Ollama to finish booting
        for _ in range(20):
            if self.is_running():
                print("Ollama is ready.")
                return True
            time.sleep(0.5)

        return False

    def generate_chat_response(self, messages):
        # Fallback check in case Ollama was closed while Django was still running
        self.ensure_running()

        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.default_model,
            "messages": messages,
            "stream": False
        }
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        return response.json()["message"]["content"]