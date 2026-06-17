from __future__ import annotations
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, field_validator


class FileMetadata(BaseModel):
    file_id: str
    filename: str
    size_bytes: int
    total_lines: int
    created_at: datetime
    python_index_time_ms: float
    cpp_index_time_ms: float | None
    index_speedup: float | None


class SearchResult(BaseModel):
    line_number: int
    text: str


class EngineSearchStats(BaseModel):
    latency_ms: float
    matches: int
    results: list[SearchResult]


class SearchResponse(BaseModel):
    file_id: str
    query: str
    engine: str
    matches: int
    latency_ms: float
    results: list[SearchResult]


class CompareResponse(BaseModel):
    file_id: str
    query: str
    python: dict
    cpp: dict | None
    speedup: float | None


class BenchmarkRequest(BaseModel):
    query: str
    iterations: int = 1000
    engine: Literal["python", "cpp", "both"] = "both"

    @field_validator("iterations")
    @classmethod
    def iterations_range(cls, v: int) -> int:
        if not (1 <= v <= 10_000):
            raise ValueError("iterations must be between 1 and 10000")
        return v


class BenchmarkStats(BaseModel):
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float


class BenchmarkResponse(BaseModel):
    query: str
    iterations: int
    python: BenchmarkStats | None
    cpp: BenchmarkStats | None


class HealthResponse(BaseModel):
    status: str
    cpp_available: bool
