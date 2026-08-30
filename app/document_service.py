import logging
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from pypdf import PdfReader


logger = logging.getLogger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_TEXT_CHARACTERS = 1_000_000
PREVIEW_CHARACTER_LIMIT = 3_000
MAX_TEMPORARY_DOCUMENTS = 10
MIN_PDF_TEXT_CHARACTERS = 20

SUPPORTED_FILE_TYPES = {
    ".pdf": {
        "file_type": "pdf",
        "content_types": {
            "application/pdf",
            "application/x-pdf",
            "application/octet-stream",
        },
    },
    ".txt": {
        "file_type": "txt",
        "content_types": {"text/plain", "application/octet-stream"},
    },
    ".md": {
        "file_type": "md",
        "content_types": {
            "text/markdown",
            "text/plain",
            "text/x-markdown",
            "application/octet-stream",
        },
    },
}


@dataclass
class ParsedDocument:
    document_id: str
    filename: str
    file_type: str
    size_bytes: int
    page_count: int | None
    text_length: int
    text: str


document_store: dict[str, ParsedDocument] = {}


class DocumentServiceError(Exception):
    code = "document_processing_error"
    status_code = 500


class UnsupportedFileTypeError(DocumentServiceError):
    code = "unsupported_file_type"
    status_code = 415


class FileTooLargeError(DocumentServiceError):
    code = "file_too_large"
    status_code = 413


class EmptyFileError(DocumentServiceError):
    code = "empty_file"
    status_code = 400


class UnreadablePdfError(DocumentServiceError):
    code = "unreadable_pdf"
    status_code = 422


class NoReadablePdfTextError(DocumentServiceError):
    code = "no_readable_pdf_text"
    status_code = 422


class InvalidTextEncodingError(DocumentServiceError):
    code = "invalid_text_encoding"
    status_code = 422


class ExtractedTextTooLargeError(DocumentServiceError):
    code = "extracted_text_too_large"
    status_code = 413


class DocumentLimitReachedError(DocumentServiceError):
    code = "document_limit_reached"
    status_code = 409


class DocumentNotFoundError(DocumentServiceError):
    code = "document_not_found"
    status_code = 404


def _safe_filename(filename):
    normalized_name = (filename or "").replace("\\", "/")
    return normalized_name.rsplit("/", 1)[-1].strip()


def _validate_file_type(filename, content_type):
    safe_filename = _safe_filename(filename)
    extension = Path(safe_filename).suffix.lower()
    file_config = SUPPORTED_FILE_TYPES.get(extension)

    if not safe_filename or file_config is None:
        raise UnsupportedFileTypeError()

    normalized_content_type = (content_type or "").split(";", 1)[0].strip().lower()
    if (
        normalized_content_type
        and normalized_content_type not in file_config["content_types"]
    ):
        raise UnsupportedFileTypeError()

    return safe_filename, file_config["file_type"]


def _normalize_text(text):
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def _extract_text_document(file_bytes):
    if b"\x00" in file_bytes:
        raise InvalidTextEncodingError()

    try:
        decoded_text = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise InvalidTextEncodingError() from error

    if len(decoded_text) > MAX_TEXT_CHARACTERS:
        raise ExtractedTextTooLargeError()

    text = _normalize_text(decoded_text)
    if not text:
        raise EmptyFileError()

    return text, None


def _extract_pdf(file_bytes):
    if not file_bytes[:1024].lstrip().startswith(b"%PDF-"):
        raise UnreadablePdfError()

    try:
        reader = PdfReader(BytesIO(file_bytes), strict=False)
        if reader.is_encrypted and reader.decrypt("") == 0:
            raise UnreadablePdfError()

        page_count = len(reader.pages)
        page_texts = []
        extracted_length = 0

        for page in reader.pages:
            page_text = _normalize_text(page.extract_text() or "")
            page_texts.append(page_text)
            extracted_length += len(page_text) + 2

            if extracted_length > MAX_TEXT_CHARACTERS:
                raise ExtractedTextTooLargeError()

        text = "\n\n".join(page_texts).strip()
    except DocumentServiceError:
        raise
    except Exception as error:
        logger.warning(
            "Unable to parse an uploaded PDF: %s",
            type(error).__name__,
        )
        raise UnreadablePdfError() from error

    if len(text) < MIN_PDF_TEXT_CHARACTERS:
        raise NoReadablePdfTextError()

    return text, page_count


def create_document(filename, content_type, file_bytes):
    safe_filename, file_type = _validate_file_type(filename, content_type)
    size_bytes = len(file_bytes)

    if size_bytes == 0:
        raise EmptyFileError()
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError()
    if len(document_store) >= MAX_TEMPORARY_DOCUMENTS:
        raise DocumentLimitReachedError()

    if file_type == "pdf":
        text, page_count = _extract_pdf(file_bytes)
    else:
        text, page_count = _extract_text_document(file_bytes)

    if len(text) > MAX_TEXT_CHARACTERS:
        raise ExtractedTextTooLargeError()

    document = ParsedDocument(
        document_id=str(uuid4()),
        filename=safe_filename,
        file_type=file_type,
        size_bytes=size_bytes,
        page_count=page_count,
        text_length=len(text),
        text=text,
    )
    document_store[document.document_id] = document
    return document


def get_document(document_id):
    return document_store.get(document_id)


def remove_document(document_id):
    document = document_store.pop(document_id, None)
    if document is None:
        raise DocumentNotFoundError()
    return document


def document_preview(document):
    return {
        "document_id": document.document_id,
        "filename": document.filename,
        "file_type": document.file_type,
        "size_bytes": document.size_bytes,
        "page_count": document.page_count,
        "text_length": document.text_length,
        "preview": document.text[:PREVIEW_CHARACTER_LIMIT],
    }
