import type { BenchmarkResponse, CompareResponse, FileMetadata, SearchResponse } from "../types";

interface Props {
  fileInfo: FileMetadata | null;
  searchResult: SearchResponse | null;
  compareResult: CompareResponse | null;
  benchmarkResult: BenchmarkResponse | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  return `${ms.toFixed(2)} ms`;
}

function formatLines(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function speedupColor(x: number | null | undefined): string {
  if (x == null) return "text-gray-500";
  if (x >= 5) return "text-neon-green";
  if (x >= 2) return "text-yellow-400";
  return "text-gray-300";
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "cyan" | "green" | "pink" | "purple" | "none";
  glow?: boolean;
}

function StatCard({ label, value, sub, accent = "none", glow = false }: CardProps) {
  const valueClass =
    accent === "cyan" ? "text-neon-cyan" :
    accent === "green" ? "text-neon-green" :
    accent === "pink" ? "text-neon-pink" :
    accent === "purple" ? "text-neon-purple" :
    "text-gray-100";

  const shadowClass =
    glow && accent === "cyan" ? "shadow-neon-cyan" :
    glow && accent === "green" ? "shadow-neon-green" :
    "";

  return (
    <div className={`card-base p-4 ${shadowClass} transition-shadow duration-300`}>
      <p className="text-xs font-mono uppercase tracking-widest text-gray-600 mb-1">{label}</p>
      <p className={`text-xl font-mono font-semibold ${valueClass} truncate`}>{value}</p>
      {sub && <p className="text-xs font-mono text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MetricsPanel({ fileInfo, searchResult, compareResult, benchmarkResult }: Props) {
  if (!fileInfo) return null;

  const speedup = fileInfo.index_speedup;
  const cppAvailable = fileInfo.cpp_index_time_ms != null;

  return (
    <div className="space-y-3">
      {/* File info row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="File" value={fileInfo.filename} sub={formatBytes(fileInfo.size_bytes)} accent="cyan" />
        <StatCard label="Total Lines" value={formatLines(fileInfo.total_lines)} sub="indexed" />
        <StatCard label="Python Index" value={formatMs(fileInfo.python_index_time_ms)} sub="build time" accent="cyan" />
        <StatCard
          label={cppAvailable ? "C++ Index" : "C++ Index"}
          value={cppAvailable ? formatMs(fileInfo.cpp_index_time_ms) : "N/A"}
          sub={cppAvailable ? "build time" : "not available"}
          accent={cppAvailable ? "green" : "none"}
        />
      </div>

      {/* Index speedup */}
      {cppAvailable && speedup != null && (
        <div className="card-base p-4 flex items-center gap-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-600">Index Speedup</p>
          <p className={`text-2xl font-mono font-bold ${speedupColor(speedup)}`}>
            {speedup}×
          </p>
          <p className="text-xs font-mono text-gray-600">C++ vs Python index build</p>
        </div>
      )}

      {/* Search results row */}
      {(searchResult || compareResult) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {compareResult ? (
            <>
              <StatCard
                label="Python Search"
                value={formatMs(compareResult.python.latency_ms)}
                sub={`${compareResult.python.matches} matches`}
                accent="cyan"
              />
              <StatCard
                label="C++ Search"
                value={compareResult.cpp ? formatMs(compareResult.cpp.latency_ms) : "N/A"}
                sub={compareResult.cpp ? `${compareResult.cpp.matches} matches` : "unavailable"}
                accent={compareResult.cpp ? "green" : "none"}
                glow={!!compareResult.cpp}
              />
              <StatCard
                label="Search Speedup"
                value={compareResult.speedup != null ? `${compareResult.speedup}×` : "N/A"}
                sub="C++ vs Python"
                accent={compareResult.speedup && compareResult.speedup >= 5 ? "green" : compareResult.speedup && compareResult.speedup >= 2 ? "none" : "none"}
              />
              <StatCard
                label="Results Found"
                value={String(compareResult.python.matches)}
                sub={`query: "${searchResult?.query ?? ""}"`}
                accent="pink"
              />
            </>
          ) : searchResult && (
            <>
              <StatCard
                label={`${searchResult.engine === "cpp" ? "C++" : "Python"} Search`}
                value={formatMs(searchResult.latency_ms)}
                sub={`${searchResult.matches} matches`}
                accent={searchResult.engine === "cpp" ? "green" : "cyan"}
              />
              <StatCard
                label="Results Found"
                value={String(searchResult.matches)}
                sub={`query: "${searchResult.query}"`}
                accent="pink"
              />
            </>
          )}
        </div>
      )}

      {/* Benchmark results */}
      {benchmarkResult && (
        <div className="card-base p-5 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
            Benchmark — {benchmarkResult.iterations} iterations · query: "{benchmarkResult.query}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchmarkResult.python && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-neon-cyan uppercase tracking-wider">Python</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["p50_ms", "p95_ms", "p99_ms"] as const).map((k) => (
                    <div key={k} className="bg-surface-3 rounded-lg p-2 text-center">
                      <p className="text-xs font-mono text-gray-600">{k.replace("_ms", "")}</p>
                      <p className="text-sm font-mono text-neon-cyan">{formatMs(benchmarkResult.python![k])}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {benchmarkResult.cpp && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-neon-green uppercase tracking-wider">C++</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["p50_ms", "p95_ms", "p99_ms"] as const).map((k) => (
                    <div key={k} className="bg-surface-3 rounded-lg p-2 text-center">
                      <p className="text-xs font-mono text-gray-600">{k.replace("_ms", "")}</p>
                      <p className="text-sm font-mono text-neon-green">{formatMs(benchmarkResult.cpp![k])}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
