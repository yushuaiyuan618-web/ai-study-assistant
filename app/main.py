from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


app = FastAPI(title="AI Study Assistant")
frontend_directory = Path(__file__).resolve().parent.parent / "frontend"


class ChatRequest(BaseModel):
    message: str
    language: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(chat_request: ChatRequest):
    if not chat_request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if chat_request.language == "zh":
        reply = "我已经收到你的问题。前端和后端已经成功连接，下一步我们会接入真正的 AI 回复。"
    else:
        reply = (
            "I received your question. The frontend and backend are now connected "
            "successfully. Real AI responses will be added in the next step."
        )

    return {"reply": reply}


# Keep the frontend mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=frontend_directory, html=True), name="frontend")
