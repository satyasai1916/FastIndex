from __future__ import annotations
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile

from .cpp_index_wrapper import CppIndexEngine
from .metrics import run_benchmark, timer_ms
from .models import (
    BenchmarkRequest,
    BenchmarkResponse,
    BenchmarkStats,
    CompareResponse,
    FileMetadata,
    HealthResponse,
    SearchResponse,
    SearchResult,
)
from .python_index import PythonIndexEngine
from .storage import get_file, insert_file

router = APIRouter()

ALLOWED_EXTENSIONS = {".txt", ".log", ".csv"}

# file_id -> {"python": PythonIndexEngine, "cpp": CppIndexEngine, "lines": list[str]}
_index_registry: dict[str, dict] = {}


def _get_entry(file_id: str) -> dict:
    entry = _index_registry.get(file_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="File not found or index lost (restart uploads file)")
    return entry


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    cpp_eng: CppIndexEngine = request.app.state.cpp_engine
    return HealthResponse(status="ok", cpp_available=cpp_eng.available)


@router.post("/files/upload", response_model=FileMetadata)
async def upload_file(request: Request, file: UploadFile = File(...)) -> FileMetadata:
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}")

    raw = await file.read()
    content = raw.decode("utf-8", errors="replace")
    lines = content.splitlines()

    file_id = uuid.uuid4().hex
    data_dir = os.environ.get("DATA_DIR", "./data")
    save_path = os.path.join(data_dir, "uploads", f"{file_id}_{file.filename}")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(raw)

    # Build Python index (build() returns its own elapsed ms)
    py_engine = PythonIndexEngine()
    py_build_ms = py_engine.build(lines)

    # Build C++ index
    cpp_engine: CppIndexEngine = request.app.state.cpp_engine
    cpp_build_ms: float | None = None
    cpp_inst: CppIndexEngine | None = None
    if cpp_engine.available:
        cpp_inst = CppIndexEngine()
        cpp_build_ms = cpp_inst.build(lines)

    _index_registry[file_id] = {
        "python": py_engine,
        "cpp": cpp_inst,
        "lines": lines,
    }

    speedup: float | None = None
    if cpp_build_ms and cpp_build_ms > 0:
        speedup = round(py_build_ms / cpp_build_ms, 2)

    now = datetime.now(timezone.utc)
    record = {
        "id": file_id,
        "filename": file.filename,
        "file_path": save_path,
        "size_bytes": len(raw),
        "total_lines": len(lines),
        "created_at": now.isoformat(),
        "python_index_time_ms": py_build_ms,
        "cpp_index_time_ms": cpp_build_ms,
    }
    db = request.app.state.db
    await insert_file(db, record)

    return FileMetadata(
        file_id=file_id,
        filename=file.filename or "",
        size_bytes=len(raw),
        total_lines=len(lines),
        created_at=now,
        python_index_time_ms=py_build_ms,
        cpp_index_time_ms=cpp_build_ms,
        index_speedup=speedup,
    )


@router.get("/files/{file_id}/search", response_model=SearchResponse)
async def search_file(
    file_id: str,
    q: str = Query(..., min_length=1),
    engine: str = Query("python", pattern="^(python|cpp)$"),
    limit: int = Query(100, ge=1, le=10000),
) -> SearchResponse:
    entry = _get_entry(file_id)
    py_eng: PythonIndexEngine = entry["python"]
    cpp_inst: CppIndexEngine | None = entry["cpp"]

    if engine == "cpp" and (cpp_inst is None or not cpp_inst.available):
        raise HTTPException(status_code=400, detail="C++ engine not available")

    if engine == "python":
        with timer_ms() as t:
            line_ids = py_eng.search(q)
        latency = t["elapsed_ms"]
        used = "python"
    else:  # cpp
        with timer_ms() as t:
            line_ids = cpp_inst.search(q)  # type: ignore[union-attr]
        latency = t["elapsed_ms"]
        used = "cpp"

    results = [
        SearchResult(line_number=lid, text=py_eng.get_line(lid))
        for lid in line_ids[:limit]
    ]

    return SearchResponse(
        file_id=file_id,
        query=q,
        engine=used,
        matches=len(line_ids),
        latency_ms=latency,
        results=results,
    )


@router.get("/files/{file_id}/compare", response_model=CompareResponse)
async def compare_search(
    file_id: str,
    q: str = Query(..., min_length=1),
) -> CompareResponse:
    entry = _get_entry(file_id)
    py_eng: PythonIndexEngine = entry["python"]
    cpp_inst: CppIndexEngine | None = entry["cpp"]

    with timer_ms() as py_t:
        py_ids = py_eng.search(q)
    py_latency = py_t["elapsed_ms"]

    cpp_stats = None
    speedup = None
    if cpp_inst and cpp_inst.available:
        with timer_ms() as cpp_t:
            cpp_ids = cpp_inst.search(q)
        cpp_latency = cpp_t["elapsed_ms"]
        cpp_stats = {"latency_ms": cpp_latency, "matches": len(cpp_ids)}
        speedup = round(py_latency / max(cpp_latency, 0.001), 2)

    return CompareResponse(
        file_id=file_id,
        query=q,
        python={"latency_ms": py_latency, "matches": len(py_ids)},
        cpp=cpp_stats,
        speedup=speedup,
    )


@router.post("/files/{file_id}/benchmark", response_model=BenchmarkResponse)
async def benchmark_search(file_id: str, body: BenchmarkRequest) -> BenchmarkResponse:
    entry = _get_entry(file_id)
    py_eng: PythonIndexEngine = entry["python"]
    cpp_inst: CppIndexEngine | None = entry["cpp"]

    eng = body.engine
    if eng in ("cpp", "both") and (cpp_inst is None or not cpp_inst.available):
        eng = "python"

    py_stats = None
    cpp_stats = None

    if eng in ("python", "both"):
        raw = run_benchmark(py_eng.search, body.query, body.iterations)
        py_stats = BenchmarkStats(**raw)

    if eng in ("cpp", "both") and cpp_inst and cpp_inst.available:
        raw = run_benchmark(cpp_inst.search, body.query, body.iterations)
        cpp_stats = BenchmarkStats(**raw)

    return BenchmarkResponse(
        query=body.query,
        iterations=body.iterations,
        python=py_stats,
        cpp=cpp_stats,
    )


@router.get("/files", response_model=list[FileMetadata])
async def list_files_endpoint(request: Request) -> list[FileMetadata]:
    from .storage import list_files
    rows = await list_files(request.app.state.db)
    result = []
    for r in rows:
        speedup = None
        if r.get("cpp_index_time_ms") and r["cpp_index_time_ms"] > 0:
            speedup = round(r["python_index_time_ms"] / r["cpp_index_time_ms"], 2)
        result.append(FileMetadata(
            file_id=r["id"],
            filename=r["filename"],
            size_bytes=r["size_bytes"],
            total_lines=r["total_lines"],
            created_at=datetime.fromisoformat(r["created_at"]),
            python_index_time_ms=r["python_index_time_ms"],
            cpp_index_time_ms=r.get("cpp_index_time_ms"),
            index_speedup=speedup,
        ))
    return result
