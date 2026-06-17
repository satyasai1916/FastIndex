from __future__ import annotations
import importlib
import logging

logger = logging.getLogger(__name__)


class CppIndexEngine:
    def __init__(self) -> None:
        self._engine = None
        self._available = False
        self._try_load()

    def _try_load(self) -> None:
        try:
            mod = importlib.import_module("flashindex_cpp")
            self._engine = mod.FlashIndexEngine()
            self._available = True
            logger.info("C++ FlashIndexEngine loaded successfully")
        except ImportError as exc:
            logger.warning("C++ engine not available: %s", exc)

    @property
    def available(self) -> bool:
        return self._available

    def build(self, lines: list[str]) -> float:
        if not self._available:
            raise RuntimeError("C++ engine not available")
        return float(self._engine.build(lines))

    def search(self, query: str) -> list[int]:
        if not self._available:
            raise RuntimeError("C++ engine not available")
        return list(self._engine.search(query))

    def get_line(self, line_id: int) -> str:
        return self._engine.get_line(line_id)

    def line_count(self) -> int:
        return self._engine.line_count()

    def clear(self) -> None:
        if self._available:
            self._engine.clear()
