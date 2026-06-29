"""LLM Router — tries providers in priority order with auto-fallback."""

from __future__ import annotations

import logging

from backend.config import get_settings
from backend.services.llm.base import BaseLLMProvider

logger = logging.getLogger("chakravyuha")

# Provider priority order (first available wins)
DEFAULT_PRIORITY = ["gemini", "mistral", "openrouter", "ollama", "sarvam"]


def _create_provider(name: str) -> BaseLLMProvider | None:
    """Lazily import and create a provider by name."""
    try:
        if name == "gemini":
            from backend.services.llm.gemini_provider import GeminiProvider
            return GeminiProvider()
        elif name == "mistral":
            from backend.services.llm.mistral_provider import MistralProvider
            return MistralProvider()
        elif name == "openrouter":
            from backend.services.llm.openrouter_provider import OpenRouterProvider
            return OpenRouterProvider()
        elif name == "ollama":
            from backend.services.llm.ollama_provider import OllamaProvider
            return OllamaProvider()
        elif name == "sarvam":
            from backend.services.llm.sarvam_provider import SarvamProvider
            return SarvamProvider()
        else:
            logger.warning("Unknown LLM provider: %s", name)
            return None
    except Exception as e:
        logger.warning("Failed to create provider '%s': %s", name, e)
        return None


class LegalLLM:
    """Unified LLM interface — routes to providers in priority order.

    Tries each provider in the configured priority list. On failure,
    falls through to the next provider. If all fail, returns None
    (caller falls back to template-based response).
    """

    def __init__(self) -> None:
        settings = get_settings()
        priority = settings.llm_priority.split(",") if settings.llm_priority else DEFAULT_PRIORITY
        priority = [p.strip() for p in priority]

        self._providers: list[BaseLLMProvider] = []
        self._active_provider: BaseLLMProvider | None = None

        logger.info("LLM priority chain: %s", " -> ".join(priority))

        for name in priority:
            provider = _create_provider(name)
            if provider and provider.is_available:
                self._providers.append(provider)
                logger.info("  [OK] %s — available", provider.name)
            else:
                logger.info("  [--] %s — unavailable", name)

        if self._providers:
            self._active_provider = self._providers[0]
            logger.info("Primary LLM provider: %s", self._active_provider.name)
        else:
            logger.warning("No LLM providers available — will use template fallback")

    @property
    def is_available(self) -> bool:
        return len(self._providers) > 0

    @property
    def provider(self) -> str:
        """Name of the currently active (primary) provider."""
        return self._active_provider.name if self._active_provider else "none"

    @property
    def available_providers(self) -> list[str]:
        """Names of all available providers in priority order."""
        return [p.name for p in self._providers]

    def generate(
        self, query: str, sections: list[dict], language: str = "en-IN"
    ) -> str | None:
        """Generate a legal response, trying providers in priority order.

        Args:
            query: User's legal question.
            sections: Retrieved legal sections from RAG.
            language: User's language code (e.g., 'hi-IN').

        Returns:
            LLM-generated response, or None if all providers fail.
        """
        for provider in self._providers:
            try:
                result = provider.generate(query, sections, language)
                if result:
                    return result
                logger.info("Provider '%s' returned empty, trying next...", provider.name)
            except Exception as e:
                logger.warning("Provider '%s' failed: %s, trying next...", provider.name, e)

        logger.warning("All LLM providers failed — falling back to template")
        return None


# Module-level singleton
_llm_service: LegalLLM | None = None


def get_llm_service() -> LegalLLM:
    """Get or create the LegalLLM singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LegalLLM()
    return _llm_service
