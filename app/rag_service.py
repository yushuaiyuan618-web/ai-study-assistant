import logging
import os
from dataclasses import dataclass
from uuid import uuid4

import numpy as np
from semantic_text_splitter import MarkdownSplitter, TextSplitter

from app.ai_service import (
    AIConnectionError,
    AIModelNotFoundError,
    AIRequestTimeoutError,
    AIServiceError,
    generate_document_answer,
    generate_embeddings,
    get_embedding_model_name,
)


logger = logging.getLogger(__name__)

CHUNK_SIZE = 1_200
CHUNK_OVERLAP = 180
MIN_CHUNK_SIZE = 400
EMBEDDING_BATCH_SIZE = 16
DEFAULT_TOP_K = 4
MAX_TOP_K = 8
MIN_RELEVANCE_SCORE = 0.45
SOURCE_SNIPPET_CHARACTERS = 240

_BASE_CHUNK_SIZE = CHUNK_SIZE - CHUNK_OVERLAP - 1
_text_splitter = TextSplitter((MIN_CHUNK_SIZE, _BASE_CHUNK_SIZE))
_markdown_splitter = MarkdownSplitter((MIN_CHUNK_SIZE, _BASE_CHUNK_SIZE))


@dataclass(frozen=True)
class RagChunk:
    chunk_id: str
    document_id: str
    filename: str
    text: str
    chunk_index: int
    page_number: int | None


@dataclass
class DocumentIndex:
    chunks: list[RagChunk]
    embeddings: np.ndarray
    embedding_model: str


@dataclass(frozen=True)
class RetrievedChunk:
    chunk: RagChunk
    score: float


document_index_store: dict[str, DocumentIndex] = {}


class RagServiceError(Exception):
    code = "document_search_error"
    status_code = 502


class EmbeddingModelNotFoundError(RagServiceError):
    code = "embedding_model_not_found"
    status_code = 503


class EmbeddingServiceUnavailableError(RagServiceError):
    code = "embedding_service_unavailable"
    status_code = 503


class EmbeddingRequestTimeoutError(RagServiceError):
    code = "embedding_request_timeout"
    status_code = 504


class DocumentIndexingError(RagServiceError):
    code = "document_indexing_error"
    status_code = 502


class DocumentNotIndexedError(RagServiceError):
    code = "document_not_indexed"
    status_code = 409


class RetrievalError(RagServiceError):
    code = "document_search_error"
    status_code = 502


def _configured_top_k():
    raw_value = os.getenv("RAG_TOP_K", str(DEFAULT_TOP_K)).strip()

    try:
        top_k = int(raw_value)
    except ValueError:
        logger.warning("Invalid RAG_TOP_K value; using %s.", DEFAULT_TOP_K)
        return DEFAULT_TOP_K

    if top_k < 1 or top_k > MAX_TOP_K:
        logger.warning(
            "RAG_TOP_K must be between 1 and %s; using %s.",
            MAX_TOP_K,
            DEFAULT_TOP_K,
        )
        return DEFAULT_TOP_K

    return top_k


def _overlap_tail(text):
    if len(text) <= CHUNK_OVERLAP:
        return text

    tail = text[-CHUNK_OVERLAP:]
    first_space = tail.find(" ")
    first_newline = tail.find("\n")
    boundaries = [index for index in (first_space, first_newline) if index >= 0]

    if boundaries:
        tail = tail[min(boundaries) + 1 :]

    return tail.strip()


def _add_overlap(chunks):
    overlapping_chunks = []
    previous_chunk = ""

    for chunk in chunks:
        base_chunk = chunk.strip()
        if not base_chunk:
            continue

        chunk_with_overlap = base_chunk
        if previous_chunk:
            overlap = _overlap_tail(previous_chunk)
            chunk_with_overlap = f"{overlap}\n{base_chunk}".strip()

        overlapping_chunks.append(chunk_with_overlap[:CHUNK_SIZE])
        previous_chunk = base_chunk

    return overlapping_chunks


def _split_text(text, file_type):
    splitter = _markdown_splitter if file_type == "md" else _text_splitter
    return _add_overlap(splitter.chunks(text))


def _create_chunks(document):
    chunks = []
    source_sections = (
        enumerate(document.pages, start=1)
        if document.pages is not None
        else [(None, document.text)]
    )

    for page_number, section_text in source_sections:
        for chunk_text in _split_text(section_text, document.file_type):
            chunks.append(
                RagChunk(
                    chunk_id=str(uuid4()),
                    document_id=document.document_id,
                    filename=document.filename,
                    text=chunk_text,
                    chunk_index=len(chunks),
                    page_number=page_number,
                )
            )

    if not chunks:
        raise DocumentIndexingError()

    return chunks


def _raise_embedding_error(error):
    if isinstance(error, AIModelNotFoundError):
        raise EmbeddingModelNotFoundError() from error
    if isinstance(error, AIConnectionError):
        raise EmbeddingServiceUnavailableError() from error
    if isinstance(error, AIRequestTimeoutError):
        raise EmbeddingRequestTimeoutError() from error
    raise DocumentIndexingError() from error


def _embed_texts(texts):
    embeddings = []

    try:
        for start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
            batch = texts[start : start + EMBEDDING_BATCH_SIZE]
            batch_embeddings = generate_embeddings(batch)
            if len(batch_embeddings) != len(batch):
                raise DocumentIndexingError()
            embeddings.extend(batch_embeddings)
    except AIServiceError as error:
        _raise_embedding_error(error)

    try:
        embedding_matrix = np.asarray(embeddings, dtype=np.float32)
        if embedding_matrix.ndim != 2 or embedding_matrix.shape[0] != len(texts):
            raise DocumentIndexingError()
        if not np.isfinite(embedding_matrix).all():
            raise DocumentIndexingError()

        norms = np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
        if np.any(norms <= 0):
            raise DocumentIndexingError()
        return embedding_matrix / norms
    except (TypeError, ValueError) as error:
        raise DocumentIndexingError() from error


def index_document(document):
    chunks = _create_chunks(document)
    embedding_matrix = _embed_texts([chunk.text for chunk in chunks])
    document_index_store[document.document_id] = DocumentIndex(
        chunks=chunks,
        embeddings=embedding_matrix,
        embedding_model=get_embedding_model_name(),
    )
    return len(chunks)


def get_document_index(document_id):
    return document_index_store.get(document_id)


def remove_document_index(document_id):
    document_index_store.pop(document_id, None)


def _embed_question(question):
    try:
        embeddings = generate_embeddings([question])
    except AIServiceError as error:
        _raise_embedding_error(error)

    if len(embeddings) != 1:
        raise RetrievalError()

    try:
        query_embedding = np.asarray(embeddings[0], dtype=np.float32)
        if query_embedding.ndim != 1 or not np.isfinite(query_embedding).all():
            raise RetrievalError()
        norm = np.linalg.norm(query_embedding)
        if norm <= 0:
            raise RetrievalError()
        return query_embedding / norm
    except (TypeError, ValueError) as error:
        raise RetrievalError() from error


def _select_diverse_chunks(candidates, top_k):
    selected = []
    deferred_neighbors = []

    for candidate in candidates:
        is_neighbor = any(
            selected_chunk.chunk.document_id == candidate.chunk.document_id
            and abs(selected_chunk.chunk.chunk_index - candidate.chunk.chunk_index) <= 1
            for selected_chunk in selected
        )

        if is_neighbor:
            deferred_neighbors.append(candidate)
            continue

        selected.append(candidate)
        if len(selected) == top_k:
            return selected

    for candidate in deferred_neighbors:
        selected.append(candidate)
        if len(selected) == top_k:
            break

    return selected


def retrieve_chunks(question, document_ids):
    unique_document_ids = list(dict.fromkeys(document_ids))
    indexes = []
    embedding_model = get_embedding_model_name()

    for document_id in unique_document_ids:
        document_index = get_document_index(document_id)
        if (
            document_index is None
            or document_index.embedding_model != embedding_model
        ):
            raise DocumentNotIndexedError()
        indexes.append(document_index)

    query_embedding = _embed_question(question)
    candidates = []

    try:
        for document_index in indexes:
            scores = document_index.embeddings @ query_embedding
            candidates.extend(
                RetrievedChunk(chunk=chunk, score=float(score))
                for chunk, score in zip(document_index.chunks, scores)
            )
    except (TypeError, ValueError) as error:
        raise RetrievalError() from error

    candidates.sort(key=lambda item: item.score, reverse=True)
    relevant_candidates = [
        candidate
        for candidate in candidates
        if candidate.score >= MIN_RELEVANCE_SCORE
    ]
    return _select_diverse_chunks(relevant_candidates, _configured_top_k())


def _build_source_context(retrieved_chunks):
    source_sections = []

    for source_number, retrieved in enumerate(retrieved_chunks, start=1):
        chunk = retrieved.chunk
        location = (
            f"Page: {chunk.page_number}"
            if chunk.page_number is not None
            else f"Chunk: {chunk.chunk_index + 1}"
        )
        safe_text = chunk.text.replace("[END UNTRUSTED SOURCE", "[END SOURCE TEXT")
        source_sections.append(
            f"[BEGIN UNTRUSTED SOURCE {source_number}]\n"
            f"Filename: {chunk.filename}\n"
            f"{location}\n"
            f"Content:\n{safe_text}\n"
            f"[END UNTRUSTED SOURCE {source_number}]"
        )

    return "\n\n".join(source_sections)


def _source_snippet(text):
    snippet = " ".join(text.split())
    if len(snippet) > SOURCE_SNIPPET_CHARACTERS:
        return f"{snippet[: SOURCE_SNIPPET_CHARACTERS - 1]}…"
    return snippet


def _source_metadata(retrieved_chunks):
    sources = []
    seen_locations = set()

    for retrieved in retrieved_chunks:
        chunk = retrieved.chunk
        location_key = (chunk.document_id, chunk.page_number)
        if location_key in seen_locations:
            continue

        seen_locations.add(location_key)
        sources.append(
            {
                "document_id": chunk.document_id,
                "filename": chunk.filename,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "snippet": _source_snippet(chunk.text),
            }
        )

    return sources


def _insufficient_reply(language):
    if language == "zh":
        return "在所选资料中没有找到足够的信息来回答这个问题。"
    return (
        "I couldn't find enough information in the selected documents to answer "
        "that question."
    )


def answer_document_question(question, document_ids, language):
    retrieved_chunks = retrieve_chunks(question, document_ids)
    if not retrieved_chunks:
        return {"reply": _insufficient_reply(language), "sources": []}

    source_context = _build_source_context(retrieved_chunks)
    reply = generate_document_answer(question, source_context, language)
    return {
        "reply": reply,
        "sources": _source_metadata(retrieved_chunks),
    }
