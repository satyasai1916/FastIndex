"""Generate sample log files for FlashIndex demo and benchmarking."""
import random
import sys
from pathlib import Path

SERVICES = ["auth-service", "api-gateway", "data-pipeline", "cache-layer", "worker-node"]
LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"]
EVENTS = [
    "request received",
    "timeout from downstream service",
    "cache miss for key",
    "connection established",
    "retrying after failure",
    "rate limit exceeded",
    "healthcheck passed",
    "index rebuilt",
    "query executed",
    "disconnected from peer",
    "reconnecting",
    "latency spike detected",
    "circuit breaker open",
    "circuit breaker closed",
    "batch processed",
]
REQUEST_IDS = [f"req_{i:06d}" for i in range(1000)]


def generate_line() -> str:
    ts = f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}T{random.randint(0,23):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}Z"
    level = random.choice(LEVELS)
    service = random.choice(SERVICES)
    event = random.choice(EVENTS)
    rid = random.choice(REQUEST_IDS)
    latency = random.randint(1, 9999)
    return f"{ts} [{level}] {service} {event} request_id={rid} latency_ms={latency}"


def generate_file(path: Path, n_lines: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for _ in range(n_lines):
            f.write(generate_line() + "\n")
    size_kb = path.stat().st_size / 1024
    print(f"Generated {path.name}: {n_lines:,} lines ({size_kb:.0f} KB)")


if __name__ == "__main__":
    out_dir = Path(__file__).parent
    generate_file(out_dir / "sample_10k.log", 10_000)
    generate_file(out_dir / "sample_100k.log", 100_000)
    print("Done. Upload these files to FlashIndex for demo/benchmarking.")
