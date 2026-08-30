import logging
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from openai import APIConnectionError, APIStatusError, OpenAI, OpenAIError


project_directory = Path(__file__).resolve().parent.parent
load_dotenv(project_directory / ".env")

logger = logging.getLogger(__name__)

DEFAULT_PROVIDER = "ollama"
DEFAULT_BASE_URL = "http://localhost:11434/v1/"
DEFAULT_MODEL = "qwen3.5:4b"
DEFAULT_API_KEY = "ollama"
MAX_HISTORY_MESSAGES = 12

STUDY_ASSISTANT_INSTRUCTIONS = (
    "You are an AI Study Assistant. Explain concepts clearly and prioritize "
    "understanding over simply giving answers. Adapt to beginners when appropriate, "
    "break complex ideas into steps, use examples when useful, avoid unnecessary "
    "jargon, and be concise unless the question needs more detail."
)


class AIServiceError(Exception):
    """Raised when the configured AI service cannot generate a response."""


class AIConfigurationError(AIServiceError):
    """Raised when the AI provider configuration is not supported."""


def _load_configuration():
    provider = os.getenv("AI_PROVIDER", DEFAULT_PROVIDER).strip().lower()

    if provider != "ollama":
        error_message = (
            f"Unsupported AI_PROVIDER '{provider}'. Step 4 supports only 'ollama'."
        )
        logger.error(error_message)
        raise AIConfigurationError(error_message)

    base_url = os.getenv("AI_BASE_URL", DEFAULT_BASE_URL).strip() or DEFAULT_BASE_URL
    model = os.getenv("AI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    api_key = os.getenv("AI_API_KEY", DEFAULT_API_KEY).strip() or DEFAULT_API_KEY

    if urlparse(base_url).hostname not in {"localhost", "127.0.0.1", "::1"}:
        error_message = (
            "AI_PROVIDER 'ollama' requires a local AI_BASE_URL using localhost "
            "or a loopback address."
        )
        logger.error(error_message)
        raise AIConfigurationError(error_message)

    return base_url, model, api_key


def _build_instructions(language):
    language_instruction = (
        "Respond in Simplified Chinese."
        if language == "zh"
        else "Respond in English."
    )
    return f"{STUDY_ASSISTANT_INSTRUCTIONS} {language_instruction}"


def _build_model_input(message, history=None):
    model_input = []

    for history_message in (history or [])[-MAX_HISTORY_MESSAGES:]:
        role = history_message.get("role")
        content = history_message.get("content", "").strip()

        if role in {"user", "assistant"} and content:
            model_input.append({"role": role, "content": content})

    model_input.append({"role": "user", "content": message})
    return model_input


def generate_reply(message, language, history=None):
    base_url, model, api_key = _load_configuration()
    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
        timeout=120.0,
        max_retries=0,
    )

    try:
        response = client.responses.create(
            model=model,
            instructions=_build_instructions(language),
            input=_build_model_input(message, history),
        )
    except APIConnectionError as error:
        logger.error(
            "Could not connect to local Ollama at %s. Make sure Ollama is running.",
            base_url,
        )
        raise AIServiceError("Local Ollama is unavailable.") from error
    except APIStatusError as error:
        if error.status_code == 404:
            logger.error(
                "Ollama returned 404 for model '%s'. Ensure Ollama supports the "
                "Responses API and install the model with: ollama pull %s",
                model,
                model,
            )
        else:
            logger.error("Ollama request failed with HTTP status %s.", error.status_code)
        raise AIServiceError("Local Ollama could not generate a response.") from error
    except OpenAIError as error:
        logger.error("The Ollama-compatible request failed: %s.", type(error).__name__)
        raise AIServiceError("Local Ollama could not generate a response.") from error

    reply = (response.output_text or "").strip()
    if not reply:
        logger.error("Ollama returned an empty response for model '%s'.", model)
        raise AIServiceError("Local Ollama returned an empty response.")

    return reply
