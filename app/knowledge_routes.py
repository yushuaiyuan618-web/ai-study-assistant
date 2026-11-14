from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app import journal_service
from app import knowledge_store as store


Language = Literal["en", "zh"]
MESSAGES = {
    "en": {
        "knowledge_not_found": "This knowledge item or learning record was not found.",
        "knowledge_storage_error": "Unable to access local knowledge data. Please try again.",
        "knowledge_already_completed": "This record has already been processed.",
        "pending": "Knowledge extraction is queued or running.",
        "completed": "Knowledge extraction completed.",
        "failed": "Knowledge extraction failed. It will retry up to three times; you can also request a retry.",
    },
    "zh": {
        "knowledge_not_found": "未找到该知识项或学习记录。",
        "knowledge_storage_error": "暂时无法访问本地知识数据，请稍后重试。",
        "knowledge_already_completed": "这条学习记录已完成知识提取。",
        "pending": "知识提取已排队或正在执行。",
        "completed": "知识提取已完成。",
        "failed": "知识提取失败，系统最多自动尝试三次，也可以手动重试。",
    },
}


def _error(code, language, status=404):
    return HTTPException(status_code=status, detail={"code": code, "message": MESSAGES[language][code]})


def knowledge_access(response: Response, language: Language = "en"):
    response.headers["Cache-Control"] = "no-store"
    try:
        yield
    except journal_service.JournalStorageError as error:
        raise _error("knowledge_storage_error", language, 503) from error


router = APIRouter(prefix="/api/knowledge", dependencies=[Depends(knowledge_access)])


@router.get("/topics")
def get_topics():
    return {"items": store.list_topics()}


@router.get("/topics/{topic_id}/concepts")
def get_topic_concepts(
    topic_id: str, language: Language = "en",
    limit: Annotated[int, Query(ge=1, le=1000)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    result = store.list_concepts(topic_id, limit, offset)
    if result is None:
        raise _error("knowledge_not_found", language)
    return result


def _require_concept(concept_id, language):
    concept = store.concept_detail(concept_id)
    if concept is None:
        raise _error("knowledge_not_found", language)
    return concept


@router.get("/topics/{topic_id}/relations")
def get_topic_relations(
    topic_id: str, language: Language = "en",
    limit: Annotated[int, Query(ge=1, le=500)] = 500,
):
    result = store.topic_relations(topic_id, limit)
    if result is None:
        raise _error("knowledge_not_found", language)
    return result


@router.get("/concepts/{concept_id}")
def get_concept(concept_id: str, language: Language = "en"):
    return _require_concept(concept_id, language)


@router.get("/concepts/{concept_id}/relations")
def get_relations(concept_id: str, language: Language = "en"):
    _require_concept(concept_id, language)
    return {"items": store.concept_relations(concept_id)}


@router.get("/concepts/{concept_id}/sources")
def get_sources(
    concept_id: str, language: Language = "en",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    concept = _require_concept(concept_id, language)
    return {
        "items": store.concept_sources(concept_id, limit, offset),
        "total": len({definition["entry_id"] for definition in concept["definitions"]}),
    }


def _job_message(job, language):
    return {**job, "message": MESSAGES[language][job["status"]]}


@router.get("/extractions")
def get_extractions(
    status: Literal["pending", "completed", "failed"] | None = None,
    language: Language = "en",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    result = store.list_jobs(status, limit, offset)
    result["items"] = [_job_message(job, language) for job in result["items"]]
    return result


@router.get("/extractions/{entry_id}")
def get_extraction(entry_id: str, language: Language = "en"):
    result = store.get_job(entry_id)
    if result is None:
        raise _error("knowledge_not_found", language)
    return _job_message(result, language)


@router.post("/extractions/{entry_id}/retry", status_code=202)
def retry_extraction(entry_id: str, language: Language = "en"):
    result = store.retry_job(entry_id)
    if result == "not_found":
        raise _error("knowledge_not_found", language)
    if result == "completed":
        raise _error("knowledge_already_completed", language, 409)
    return _job_message(store.get_job(entry_id), language)
