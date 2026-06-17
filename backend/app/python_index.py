from __future__ import annotations
import re
import time
from collections import defaultdict


class PythonIndexEngine:
    def __init__(self) -> None:
        self._lines: list[str] = []
        self._index: dict[str, list[int]] = defaultdict(list)

    def build(self, lines: list[str]) -> float:
        self._lines = lines
        self._index = defaultdict(list)
        t0 = time.perf_counter_ns()
        for i, line in enumerate(lines):
            for token in self._tokenize(line):
                self._index[token].append(i)
        elapsed_ms = (time.perf_counter_ns() - t0) / 1_000_000.0
        return elapsed_ms

    def search(self, query: str) -> list[int]:
        tokens = self._tokenize(query)
        if not tokens:
            return []
        if len(tokens) == 1:
            return list(self._index.get(tokens[0], []))
        # multi-token: intersection of posting lists
        sets = [set(self._index.get(t, [])) for t in tokens]
        result = sets[0]
        for s in sets[1:]:
            result = result & s
        return sorted(result)

    def get_line(self, line_id: int) -> str:
        return self._lines[line_id]

    def line_count(self) -> int:
        return len(self._lines)

    def clear(self) -> None:
        self._lines.clear()
        self._index.clear()

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", text.lower())
