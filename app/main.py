from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from app.ai_service import (
    AIConfigurationError,
    AIConnectionError,
    AIEmptyResponseError,
    AIModelNotFoundError,
    AIRequestTimeoutError,
    AIServiceError,
    generate_explanation,
    generate_quiz,
    generate_reply,
)


app = FastAPI(title="AI Study Assistant")
frontend_directory = Path(__file__).resolve().parent.parent / "frontend"
quiz_store = {}


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    language: str
    history: list[ConversationMessage] = Field(default_factory=list)


class ExplainRequest(BaseModel):
    topic: str
    style: Literal["simple", "detailed", "example"]
    language: Literal["en", "zh"]


class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: Literal["easy", "medium", "hard"]
    language: Literal["en", "zh"]


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: list[int] = Field(min_length=5, max_length=5)

    @field_validator("answers")
    @classmethod
    def validate_answer_indexes(cls, answers):
        if any(answer < 0 or answer > 3 for answer in answers):
            raise ValueError("Answer indexes must be between 0 and 3.")
        return answers


def _ai_http_error(error):
    if isinstance(error, AIConfigurationError):
        return HTTPException(status_code=503, detail="ai_configuration_error")
    if isinstance(error, AIConnectionError):
        return HTTPException(status_code=503, detail="ollama_unavailable")
    if isinstance(error, AIModelNotFoundError):
        return HTTPException(status_code=503, detail="model_not_found")
    if isinstance(error, AIRequestTimeoutError):
        return HTTPException(status_code=504, detail="ai_request_timeout")
    if isinstance(error, AIEmptyResponseError):
        return HTTPException(status_code=502, detail="empty_ai_response")
    return HTTPException(status_code=502, detail="ai_generation_error")


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
    except AIServiceError as error:
        raise _ai_http_error(error) from error

    return {"reply": reply}


@app.post("/api/explain")
def explain(explain_request: ExplainRequest):
    topic = explain_request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    try:
        reply = generate_explanation(
            topic,
            explain_request.style,
            explain_request.language,
        )
    except AIServiceError as error:
        raise _ai_http_error(error) from error

    return {"reply": reply}


@app.post("/api/quiz/generate")
def generate_quiz_endpoint(quiz_request: QuizGenerateRequest):
    topic = quiz_request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    try:
        quiz = generate_quiz(
            topic,
            quiz_request.difficulty,
            quiz_request.language,
        )
    except AIServiceError as error:
        raise _ai_http_error(error) from error

    quiz_id = str(uuid4())
    quiz_store[quiz_id] = quiz
    questions = [
        {
            "id": question.id,
            "question": question.question,
            "options": question.options,
        }
        for question in quiz.questions
    ]

    return {
        "quiz_id": quiz_id,
        "topic": topic,
        "difficulty": quiz_request.difficulty,
        "questions": questions,
    }


@app.post("/api/quiz/submit")
def submit_quiz(quiz_request: QuizSubmitRequest):
    quiz = quiz_store.pop(quiz_request.quiz_id, None)
    if quiz is None:
        raise HTTPException(status_code=404, detail="quiz_not_found")

    results = []
    score = 0

    for question, user_answer in zip(quiz.questions, quiz_request.answers):
        is_correct = user_answer == question.correct_index
        if is_correct:
            score += 1

        results.append(
            {
                "question_id": question.id,
                "user_answer": user_answer,
                "correct_answer": question.correct_index,
                "correct": is_correct,
                "explanation": question.explanation,
            }
        )

    return {"score": score, "total": len(quiz.questions), "results": results}


# Keep the frontend mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=frontend_directory, html=True), name="frontend")
