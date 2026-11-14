"""Conservative concept matching and evidence-grounded graph construction."""

import logging
import re
from uuid import uuid4

import numpy as np

from app.ai_service import AIConnectionError, AIModelNotFoundError, AIRequestTimeoutError
from app.ai_service import generate_embeddings, get_embedding_model_name
from app.knowledge_ai import confirm_match, extract_knowledge
from app.knowledge_models import name_key
from app import knowledge_store as store


logger = logging.getLogger(__name__)
CANDIDATE_THRESHOLD = 0.62


class JobCancelled(Exception):
    pass


def _labels(item):
    return {name_key(label) for label in [item["name"], *item["aliases"]]}


def _merge_labels(*groups):
    labels = {}
    for group in groups:
        for label in group:
            labels.setdefault(name_key(label), label)
    return list(labels.values())


def _embed(texts):
    matrix = np.asarray(generate_embeddings(texts), dtype=np.float32)
    if matrix.ndim != 2 or matrix.shape[0] != len(texts) or matrix.shape[1] == 0:
        raise ValueError("Invalid knowledge embedding shape.")
    if not np.isfinite(matrix).all():
        raise ValueError("Non-finite knowledge embedding.")
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    if np.any(norms <= 0):
        raise ValueError("Empty knowledge embedding.")
    return matrix / norms


def _candidates(incoming, vector, existing):
    if not existing:
        return []
    vectors = []
    for item in existing:
        stored = np.frombuffer(item["embedding"], dtype=np.float32)
        if item["embedding_model"] != get_embedding_model_name() or stored.shape != vector.shape:
            raise ValueError("Knowledge embedding configuration changed.")
        if not np.isfinite(stored).all() or not np.isclose(np.linalg.norm(stored), 1, atol=0.001):
            raise ValueError("Corrupt knowledge embedding.")
        vectors.append(stored)
    # Same dense cosine strategy as the existing RAG service; similarity only nominates candidates.
    scores = np.asarray(vectors, dtype=np.float32) @ vector
    names = _labels(incoming)
    indexes = [index for index in range(len(existing))
               if scores[index] >= CANDIDATE_THRESHOLD or names & _labels(existing[index])]
    indexes.sort(key=lambda index: (bool(names & _labels(existing[index])), float(scores[index])), reverse=True)
    return [existing[index] for index in indexes[:3]]


def _mentioned(item, text):
    for label in _labels(item):
        if len(label) < 2:
            continue
        if label.isascii():
            if re.search(r"(?<!\w)" + re.escape(label) + r"(?!\w)", text):
                return True
        elif label in text:
            return True
    return False


def _resolve_topic(incoming, vector, topics, checkpoint):
    exact = [topic for topic in topics if _labels(incoming) & _labels(topic)]
    if len(exact) == 1:
        match = exact[0]
    else:
        candidates = _candidates(incoming, vector, topics)
        checkpoint()
        match = confirm_match("topic", incoming, candidates) if candidates else None
    if match is not None:
        match["aliases"] = _merge_labels(match["aliases"], [incoming["name"]], incoming["aliases"])
        return match
    topic = {
        "id": str(uuid4()), **incoming, "name_key": name_key(incoming["name"]),
        "embedding": vector.tobytes(), "embedding_model": get_embedding_model_name(),
    }
    topics.append(topic)
    return topic


def _resolve_endpoint(label, concepts):
    matches = {item["id"]: item for item in concepts if name_key(label) in _labels(item)}
    return next(iter(matches.values())) if len(matches) == 1 else None


def _supported_relations(extraction, concepts, source_text):
    supported = []
    for relation in extraction.relations:
        source = _resolve_endpoint(relation.source, concepts)
        target = _resolve_endpoint(relation.target, concepts)
        evidence = relation.evidence.strip()
        if (evidence[:1], evidence[-1:]) in (("\"", "\""), ("'", "'"), ("“", "”")):
            evidence = evidence[1:-1].strip()
        quote = name_key(evidence)
        if source is None or target is None or source["id"] == target["id"]:
            continue
        if quote not in source_text or not _mentioned(source, quote) or not _mentioned(target, quote):
            continue
        source_id, target_id = source["id"], target["id"]
        if relation.relation_type in ("related_to", "contrasts_with"):
            source_id, target_id = sorted((source_id, target_id))
        supported.append({
            "source_id": source_id, "target_id": target_id,
            "relation_type": relation.relation_type, "reason": relation.reason, "evidence": evidence,
        })
    return supported


def process_job(job, checkpoint):
    entry = job["entry"]
    topics, existing = store.graph_snapshot()
    checkpoint()
    extraction = extract_knowledge(entry["question"], entry["answer"], topics)
    checkpoint()
    if extraction.outcome == "non_learning":
        return store.save_graph(job, [], [], [], "non_learning")

    source_text = name_key(entry["question"] + "\n" + entry["answer"])
    concepts = [concept for concept in extraction.concepts if _mentioned(concept.model_dump(), source_text)]
    if not concepts:
        raise ValueError("Extracted concept names are not grounded in the learning pair.")
    texts = []
    for concept in concepts:
        texts.extend([
            f"{concept.name}. {concept.definition} Aliases: {', '.join(concept.aliases)}",
            f"{concept.topic}. {', '.join(concept.topic_aliases)}",
        ])
    checkpoint()
    vectors = _embed(texts)
    planned, used_topics = [], {}
    for index, concept in enumerate(concepts):
        incoming = {"name": concept.name, "definition": concept.definition,
                    "aliases": concept.aliases, "topic_name": concept.topic}
        candidates = _candidates(incoming, vectors[index * 2], existing)
        checkpoint()
        match = confirm_match("concept", incoming, candidates) if candidates else None
        if match is not None:
            node = match.copy()
            node["aliases"] = _merge_labels(match["aliases"], [concept.name], concept.aliases)
            node["keywords"] = _merge_labels(match["keywords"], concept.keywords)
        else:
            topic = _resolve_topic(
                {"name": concept.topic, "aliases": concept.topic_aliases},
                vectors[index * 2 + 1], topics, checkpoint,
            )
            used_topics[topic["id"]] = topic
            node = {
                "id": str(uuid4()), "topic_id": topic["id"], "topic_name": topic["name"],
                "name": concept.name, "definition": concept.definition,
                "aliases": concept.aliases, "keywords": concept.keywords,
                "embedding": vectors[index * 2].tobytes(), "embedding_model": get_embedding_model_name(),
            }
        node["extracted"] = concept
        planned.append(node)
        existing = [item for item in existing if item["id"] != node["id"]] + [node]

    # Include new bilingual aliases when resolving relation endpoints.
    relations = _supported_relations(extraction, existing, source_text)
    checkpoint()
    return store.save_graph(job, list(used_topics.values()), planned, relations, "extracted")


def process_pending_once(checkpoint=None):
    """A bounded unit of work shared by the worker and deterministic tests."""
    job = store.claim_job()
    if job is None:
        return None

    def check():
        if checkpoint is not None:
            checkpoint(job)
        if not store.renew_job(job["entry"]["id"], job["token"]):
            raise JobCancelled()

    try:
        process_job(job, check)
    except JobCancelled:
        store.release_job(job["entry"]["id"], job["token"])
    except Exception as error:
        code = "knowledge_generation_error"
        if isinstance(error, AIConnectionError):
            code = "ollama_unavailable"
        elif isinstance(error, AIModelNotFoundError):
            code = "model_not_found"
        elif isinstance(error, AIRequestTimeoutError):
            code = "ai_request_timeout"
        logger.warning("Knowledge extraction failed (%s): %s", code, type(error).__name__)
        store.fail_job(job, code)
    return store.get_job(job["entry"]["id"])
