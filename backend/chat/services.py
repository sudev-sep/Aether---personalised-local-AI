from django.conf import settings
import requests

class OllamaService:
    def __init__(self, base_url="http://localhost:11434", default_model="llama3.2:3b"):
        self.base_url = base_url
        self.default_model = default_model

    def generate_chat_response(self, messages):
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.default_model,
            "messages": messages,
            "stream": False
        }
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        return response.json()["message"]["content"]