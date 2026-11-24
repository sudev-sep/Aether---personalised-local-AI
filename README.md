# Aether AI

Aether AI is a local-first chat workspace for running an AI assistant on your own computer. It combines an Angular interface with a Django API, stores conversations and saved memories in SQLite, and uses Ollama to generate responses with a local Llama 3.2 model.

## Features

- Chat with a local Ollama model.
- Save and revisit conversation history.
- Add and remove long-term memory facts, which are included in the assistant's prompt.
- Hide conversations from the sidebar and restore them later.
- Use `Ctrl+K` to start a new conversation.

> **Local-development project:** The frontend and backend currently use fixed localhost URLs, and the Django settings contain development-only configuration. Do not expose this setup to the public internet or use it as-is in production.

## Technology

- **Frontend:** Angular 19
- **Backend:** Django and Django REST Framework
- **Database:** SQLite
- **Local inference:** Ollama with `llama3.2:3b`

## Prerequisites

- Python and pip
- Node.js and npm
- [Ollama](https://ollama.com/) installed

Pull the model used by the backend before chatting:

```bash
ollama pull llama3.2:3b
```

The backend attempts to start `ollama serve` if Ollama is not already running.

## Run locally

Open separate terminals from the project root.

### 1. Start the Django backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Install the backend packages:

```bash
python -m pip install Django djangorestframework django-cors-headers requests
```

Create/update the local database, create a user (the chat API uses the first user in the database), and start Django:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend API will be available at `http://127.0.0.1:8000/`.

### 2. Start the Angular frontend

In another terminal:

```bash
cd frontend
npm ci
npm start
```

Open `http://localhost:4200/`.

## API overview

The frontend communicates with these Django endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/chat/` | Send a prompt; accepts `{"prompt": "...", "conversation_id": 1}`. Omit `conversation_id` to start a conversation. |
| `GET` | `/api/conversations/` | List saved conversations. |
| `GET` | `/api/conversations/<id>/` | Retrieve messages for a conversation. |
| `GET` | `/api/memories/` | List saved memory facts. |
| `POST` | `/api/memories/` | Save a fact using `{"fact": "..."}`. |
| `DELETE` | `/api/memories/<id>/` | Delete a saved fact. |

You can also save a memory directly in chat with:

```text
/remember My preferred language is Python
```

## Data and privacy

Conversation history and memory facts are stored in the backend's SQLite database (`backend/db.sqlite3`). Model inference is sent to the local Ollama service; this project does not require a hosted AI API. Back up the database if you want to preserve local conversations and memories.

## Tests and builds

Run the Angular tests and production build from `frontend/`:

```bash
npm test
npm run build
```

Run Django's test suite and system checks from `backend/`:

```bash
python manage.py test
python manage.py check
```
