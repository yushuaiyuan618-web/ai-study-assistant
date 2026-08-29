from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.ai_service import AIConfigurationError, AIServiceError, generate_reply


app = FastAPI(title="AI Study Assistant")
frontend_directory = Path(__file__).resolve().parent.parent / "frontend"


class ChatRequest(BaseModel):
    message: str
    language: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(chat_request: ChatRequest):
    if not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    language = "zh" if chat_request.language == "zh" else "en"

    try:
        reply = generate_reply(chat_request.message.strip(), language)
    except AIConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail="The AI service is not configured correctly.",
        ) from error
    except AIServiceError as error:
        raise HTTPException(
            status_code=503,
            detail="Local AI is not available.",
        ) from error

    return {"reply": reply}


# Keep the frontend mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=frontend_directory, html=True), name="frontend")
