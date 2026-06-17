from __future__ import annotations
import time
from contextlib import contextmanager
from typing import Callable
import numpy as np


@contextmanager
def timer_ms():
    """Yields a dict; on exit writes elapsed_ms into it."""
    result: dict = {}
    start = time.perf_counter_ns()
    yield result
    result["elapsed_ms"] = (time.perf_counter_ns() - start) / 1_000_000.0


def run_benchmark(search_fn: Callable, query: str, iterations: int) -> dict:
    latencies: list[float] = []
    for _ in range(iterations):
        t0 = time.perf_counter_ns()
        search_fn(query)
        latencies.append((time.perf_counter_ns() - t0) / 1_000_000.0)
    arr = np.array(latencies)
    return {
        "p50_ms": float(np.percentile(arr, 50)),
        "p95_ms": float(np.percentile(arr, 95)),
        "p99_ms": float(np.percentile(arr, 99)),
        "min_ms": float(arr.min()),
        "max_ms": float(arr.max()),
    }
