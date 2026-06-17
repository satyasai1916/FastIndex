export interface FileMetadata {
  file_id: string;
  filename: string;
  size_bytes: number;
  total_lines: number;
  created_at: string;
  python_index_time_ms: number;
  cpp_index_time_ms: number | null;
  index_speedup: number | null;
}

export interface SearchResult {
  line_number: number;
  text: string;
}

export interface SearchResponse {
  file_id: string;
  query: string;
  engine: string;
  matches: number;
  latency_ms: number;
  results: SearchResult[];
}

export interface CompareResponse {
  file_id: string;
  query: string;
  python: { latency_ms: number; matches: number };
  cpp: { latency_ms: number; matches: number } | null;
  speedup: number | null;
}

export interface BenchmarkStats {
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  min_ms: number;
  max_ms: number;
}

export interface BenchmarkResponse {
  query: string;
  iterations: number;
  python: BenchmarkStats | null;
  cpp: BenchmarkStats | null;
}

export type AppState = "idle" | "uploading" | "ready" | "searching" | "benchmarking";
export type EngineMode = "python" | "cpp" | "compare";
