import logging
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
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
    generate_study_plan,
)
from app.document_service import (
    MAX_FILE_SIZE_BYTES,
    DocumentServiceError,
    create_document,
    document_preview,
    remove_document,
)


logger = logging.getLogger(__name__)
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


class StudyPlanRequest(BaseModel):
    goal: str
    level: Literal["beginner", "intermediate", "advanced"]
    daily_minutes: int = Field(ge=15, le=480)
    duration_days: Literal[7, 30]
    language: Literal["en", "zh"]


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


def _document_http_error(error):
    return HTTPException(status_code=error.status_code, detail=error.code)


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


@app.post("/api/study-plan")
def create_study_plan(study_plan_request: StudyPlanRequest):
    goal = study_plan_request.goal.strip()
    if not goal:
        raise HTTPException(status_code=400, detail="Goal cannot be empty.")

    try:
        study_plan = generate_study_plan(
            goal,
            study_plan_request.level,
            study_plan_request.daily_minutes,
            study_plan_request.duration_days,
            study_plan_request.language,
        )
    except AIServiceError as error:
        raise _ai_http_error(error) from error

    return study_plan.model_dump()


@app.post("/api/documents/upload")
async def upload_document(
    file: Annotated[UploadFile, File(description="A PDF, TXT, or Markdown file")],
):
    filename = file.filename
    content_type = file.content_type

    try:
        file_bytes = await file.read(MAX_FILE_SIZE_BYTES + 1)
    except Exception as error:
        logger.warning("Unable to read an uploaded document: %s", type(error).__name__)
        raise HTTPException(
            status_code=500,
            detail="document_processing_error",
        ) from error
    finally:
        await file.close()

    try:
        document = create_document(filename, content_type, file_bytes)
    except DocumentServiceError as error:
        raise _document_http_error(error) from error

    return document_preview(document)


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    try:
        remove_document(document_id)
    except DocumentServiceError as error:
        raise _document_http_error(error) from error

    return {"document_id": document_id, "removed": True}


# Keep the frontend mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=frontend_directory, html=True), name="frontend")
