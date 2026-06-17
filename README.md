# FlashIndex

Upload large `.log`, `.txt`, or `.csv` files and search them instantly using a Python + C++ inverted index engine. The dashboard compares indexing and search performance side-by-side with p50/p95/p99 latency metrics.

---

## Architecture

```
Browser (React + Vite)
        │
        │  /api/*  (nginx proxy)
        ▼
FastAPI Backend  ──► PythonIndexEngine   (dict-based inverted index)
        │        └─► CppIndexEngine      (unordered_map via pybind11)
        │
        ▼
SQLite (file metadata)  +  Local file storage
```

Everything runs in **Docker Compose** — no host dependencies needed.

---

## Quickstart

**Requirements:** Docker + Docker Compose (v2)

```bash
# Clone / enter the project
cd flashindex

# Build and start (first build compiles the C++ engine inside Docker)
docker compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

> First build takes 2–4 minutes because it compiles the C++ pybind11 module.  
> Subsequent starts are fast (cached layers).

---

## Generate Sample Data

```bash
python3 data/sample/generate.py
# Creates data/sample/sample_10k.log  (~700 KB)
#         data/sample/sample_100k.log (~7 MB)
```

Upload these files via the UI for instant demo and benchmarking.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Status + C++ engine availability |
| POST | `/files/upload` | Upload + index a file |
| GET | `/files/{id}/search?q=&engine=` | Search (engine: python/cpp/both) |
| GET | `/files/{id}/compare?q=` | Side-by-side Python vs C++ |
| POST | `/files/{id}/benchmark` | p50/p95/p99 over N iterations |
| GET | `/files` | List uploaded files |

### Example: upload + search

```bash
# Upload
curl -X POST http://localhost:8000/files/upload \
  -F "file=@data/sample/sample_10k.log"

# Search (replace FILE_ID)
curl "http://localhost:8000/files/FILE_ID/search?q=timeout&engine=both"

# Compare
curl "http://localhost:8000/files/FILE_ID/compare?q=error"

# Benchmark
curl -X POST "http://localhost:8000/files/FILE_ID/benchmark" \
  -H "Content-Type: application/json" \
  -d '{"query":"timeout","iterations":500,"engine":"both"}'
```

---

## Project Structure

```
flashindex/
├── backend/
│   ├── Dockerfile          # Multi-stage: compiles C++ then runs Python
│   ├── requirements.txt
│   └── app/
│       ├── main.py         # FastAPI app + lifespan (SQLite init)
│       ├── api.py          # Route handlers
│       ├── models.py       # Pydantic schemas
│       ├── storage.py      # aiosqlite helpers
│       ├── python_index.py # Pure-Python inverted index
│       ├── cpp_index_wrapper.py  # pybind11 wrapper (graceful fallback)
│       └── metrics.py      # timer_ms(), run_benchmark()
├── cpp/
│   ├── CMakeLists.txt
│   ├── flashindex.cpp      # FlashIndexEngine class (C++17)
│   └── bindings.cpp        # pybind11 module definition
├── frontend/
│   ├── Dockerfile          # Node build → nginx serve
│   ├── nginx.conf          # /api/ proxy + SPA fallback
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── types.ts
│       └── components/
│           ├── UploadBox.tsx
│           ├── SearchBox.tsx
│           ├── MetricsPanel.tsx
│           └── ResultsTable.tsx
├── data/
│   ├── uploads/            # Uploaded files (Docker volume)
│   ├── sample/             # Sample log files + generator
│   └── flashindex.db       # SQLite metadata (Docker volume)
└── docker-compose.yml
```

---

## How It Works

### Inverted Index

```
Line 0: "error timeout from auth-service"
Line 1: "auth-service recovered"

Index:
  error       → [0]
  timeout     → [0]
  from        → [0]
  auth        → [0, 1]
  service     → [0, 1]
  recovered   → [1]
```

Tokenization: lowercase + keep `[a-z0-9]` runs (identical rule in Python and C++).

### Python Engine
- `dict[str, list[int]]` inverted index
- `time.perf_counter_ns()` timing

### C++ Engine
- `std::unordered_map<std::string, std::vector<int>>`
- `std::chrono::steady_clock` timing
- GIL released during `build` and `search` for maximum throughput
- Exposed via pybind11 with automatic `std::vector` ↔ Python list conversion

---

## Limitations (MVP)

- **In-memory only**: Index is lost if the backend restarts. Re-upload the file.
- **Single worker**: `--workers 1` required because the index registry is process-local.
- **No PDF support**: Add after base system is solid.
- **No auth / multi-user**: Single-session tool.

---

## Future Work

- Persistent index storage (mmap or RocksDB)
- Phrase search and prefix/trie search
- SIMD-accelerated string scanning
- Parallel indexing with worker queues
- Multi-file search
- PDF parsing
- eBPF / flamegraph profiling
- Docker Compose deployment with TLS

---

## Resume / Interview Pitch

Built **FlashIndex** — a Python FastAPI + C++ search engine using pybind11 to index and search large log/CSV/text files with low-latency lookup. Implemented inverted indexing with identical tokenization across both language runtimes, benchmarked Python vs C++ search paths end-to-end, and exposed p50/p95/p99 latency metrics through an interactive dark-themed React UI.
