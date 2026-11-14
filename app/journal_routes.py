import logging
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import AwareDatetime, BaseModel, StrictBool

from app import journal_service
from app.journal_pdf import generate_journal_pdf


logger = logging.getLogger(__name__)


def journal_access(response: Response):
    response.headers["Cache-Control"] = "no-store"
    try:
        yield
    except journal_service.JournalStorageError as error:
        raise HTTPException(status_code=503, detail="journal_storage_error") from error


router = APIRouter(prefix="/api/journal", dependencies=[Depends(journal_access)])


class JournalSettingsRequest(BaseModel):
    auto_record: StrictBool


class JournalStarRequest(BaseModel):
    starred: StrictBool


class JournalClearRequest(BaseModel):
    confirmed: Literal[True]


def journal_filters(
    kind: Literal["all", "starred", "normal"] = "all",
    start: AwareDatetime | None = None,
    end: AwareDatetime | None = None,
    order: Literal["newest", "oldest"] = "newest",
):
    if start is not None and end is not None and start >= end:
        raise HTTPException(status_code=422, detail="journal_invalid_dates")
    return {"kind": kind, "start": start, "end": end, "order": order}


@router.get("/settings")
def get_journal_settings():
    return journal_service.get_settings()


@router.put("/settings")
def update_journal_settings(request: JournalSettingsRequest):
    return journal_service.set_auto_record(request.auto_record)


@router.get("")
def get_journal(
    filters: Annotated[dict, Depends(journal_filters)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return journal_service.list_entries(**filters, limit=limit, offset=offset)


@router.get("/export")
def export_journal(
    filters: Annotated[dict, Depends(journal_filters)],
    language: Literal["en", "zh"] = "en",
    utc_offset: Annotated[int, Query(ge=-840, le=840)] = 0,
):
    entries = journal_service.list_entries(**filters, limit=None)["entries"]
    if not entries:
        raise HTTPException(status_code=400, detail="journal_empty")
    try:
        pdf = generate_journal_pdf(entries, language, utc_offset)
    except Exception as error:
        logger.warning("Learning Journal PDF failed: %s", type(error).__name__)
        raise HTTPException(status_code=500, detail="journal_export_error") from error
    return Response(
        content=pdf, media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="my-learning-journal.pdf"',
            "Cache-Control": "no-store",
        },
    )


@router.patch("/{entry_id}")
def mark_journal_entry(entry_id: str, request: JournalStarRequest):
    if not journal_service.set_starred(entry_id, request.starred):
        raise HTTPException(status_code=404, detail="journal_not_found")
    return {"id": entry_id, "starred": request.starred}


@router.delete("/{entry_id}")
def delete_journal_entry(entry_id: str):
    if not journal_service.delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="journal_not_found")
    return {"id": entry_id, "deleted": True}


@router.delete("")
def clear_journal(request: JournalClearRequest):
    journal_service.clear_entries()
    return {"cleared": True}
