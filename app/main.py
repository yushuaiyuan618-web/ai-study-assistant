from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.ai_service import (
    AIConfigurationError,
    AIConnectionError,
    AIEmptyResponseError,
    AIModelNotFoundError,
    AIRequestTimeoutError,
    AIServiceError,
    generate_reply,
)


app = FastAPI(title="AI Study Assistant")
frontend_directory = Path(__file__).resolve().parent.parent / "frontend"


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    language: str
    history: list[ConversationMessage] = Field(default_factory=list)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(chat_request: ChatRequest):
    if not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    language = "zh" if chat_request.language == "zh" else "en"
    history = [
        {"role": history_message.role, "content": history_message.content.strip()}
        for history_message in chat_request.history
        if history_message.content.strip()
    ]

    try:
        reply = generate_reply(chat_request.message.strip(), language, history)
    except AIConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail="ai_configuration_error",
        ) from error
    except AIConnectionError as error:
        raise HTTPException(
            status_code=503,
            detail="ollama_unavailable",
        ) from error
    except AIModelNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail="model_not_found",
        ) from error
    except AIRequestTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="ai_request_timeout",
        ) from error
    except AIEmptyResponseError as error:
        raise HTTPException(
            status_code=502,
            detail="empty_ai_response",
        ) from error
    except AIServiceError as error:
        raise HTTPException(
            status_code=502,
            detail="ai_generation_error",
        ) from error

    return {"reply": reply}


# Keep the frontend mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=frontend_directory, html=True), name="frontend")
