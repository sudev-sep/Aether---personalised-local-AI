import requests
from django.conf import settings

class OllamaService:
    def __init__(self):
        self.base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        self.default_model = getattr(settings, "OLLAMA_MODEL", "llama3.2:3b ") 
    def generate_response(self, prompt, system_prompt=None):
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.default_model,
            "prompt": prompt,
            "stream": False
        }
        
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except requests.exceptions.RequestException as e:
            # Fallback or error logging
            raise Exception(f"Failed to communicate with Ollama: {str(e)}")