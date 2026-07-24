"""PhysicaX AI Backend - Local Physics Tutor."""
import json
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PhysicaX AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

SYSTEM_PROMPT = (
    "You are a physics tutor for the PhysicaX platform. "
    "Help with thermodynamics, mechanics, chaos, waves, electromagnetism, and ODE/PDE. "
    "Use LaTeX-like notation when helpful, for example $PV=nRT$. "
    "Be concise and educational."
)


class ChatRequest(BaseModel):
    message: str
    history: list = []


class ChatResponse(BaseModel):
    response: str


def generate_response(message: str, history: list) -> str:
    prompt = SYSTEM_PROMPT + "\n\n"
    for turn in history[-6:]:
        role = turn.get("role", "user") if isinstance(turn, dict) else "user"
        content = turn.get("content", str(turn))
        prompt += f"{role}: {content}\n"
    prompt += f"user: {message}\nassistant:"

    try:
        import requests
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7, "num_ctx": 2048, "num_predict": 512},
            },
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("response", "[No response]").strip()
    except Exception as e:
        return f"[AI error] {e}"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    return ChatResponse(response=generate_response(req.message, req.history))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
