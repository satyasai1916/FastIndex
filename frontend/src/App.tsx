import { useEffect, useState } from "react";
import { Zap, Cpu, RotateCcw } from "lucide-react";
import UploadBox from "./components/UploadBox";
import SearchBox from "./components/SearchBox";
import MetricsPanel from "./components/MetricsPanel";
import ResultsTable from "./components/ResultsTable";
import { compareSearch, searchFile, benchmarkSearch, healthCheck } from "./api";
import type {
  AppState,
  BenchmarkResponse,
  CompareResponse,
  EngineMode,
  FileMetadata,
  SearchResponse,
} from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [cppAvailable, setCppAvailable] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileMetadata | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    healthCheck()
      .then((h) => setCppAvailable(h.cpp_available))
      .catch(() => setCppAvailable(false));
  }, []);

  const handleUploadSuccess = (meta: FileMetadata) => {
    setFileInfo(meta);
    setCppAvailable(meta.cpp_index_time_ms != null);
    setSearchResult(null);
    setCompareResult(null);
    setBenchmarkResult(null);
    setAppState("ready");
  };

  const handleSearch = async (query: string, engine: EngineMode) => {
    if (!fileInfo) return;
    setSearchLoading(true);
    setCurrentQuery(query);
    setSearchResult(null);
    setCompareResult(null);
    setBenchmarkResult(null);

    try {
      if (engine === "compare") {
        const [sr, cr] = await Promise.all([
          searchFile(fileInfo.file_id, query, "python"),
          compareSearch(fileInfo.file_id, query),
        ]);
        setSearchResult(sr);
        setCompareResult(cr);
      } else {
        const sr = await searchFile(fileInfo.file_id, query, engine);
        setSearchResult(sr);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBenchmark = async (query: string, iterations: number) => {
    if (!fileInfo) return;
    setSearchLoading(true);
    setCurrentQuery(query);
    setSearchResult(null);
    setCompareResult(null);
    setBenchmarkResult(null);
    try {
      const engine = cppAvailable ? "both" : "python";
      const result = await benchmarkSearch(fileInfo.file_id, query, iterations, engine as any);
      setBenchmarkResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleReset = () => {
    setFileInfo(null);
    setSearchResult(null);
    setCompareResult(null);
    setBenchmarkResult(null);
    setCurrentQuery("");
    setAppState("idle");
  };

  const hasResults =
    searchResult !== null || compareResult !== null || benchmarkResult !== null;

  return (
    <div className="min-h-screen bg-surface bg-grid-pattern bg-grid font-sans">
      {/* Header */}
      <header className="border-b border-border-dim bg-surface-2/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-6 h-6 text-neon-cyan" />
              <div className="absolute inset-0 blur-md bg-neon-cyan/40 rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-semibold text-gradient-cyan tracking-tight">
                FlashIndex
              </h1>
              <p className="text-xs font-mono text-gray-600 leading-none">
                low-latency file search
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cppAvailable ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-neon-green">
                <Cpu className="w-3.5 h-3.5" />
                C++ engine active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
                <Cpu className="w-3.5 h-3.5" />
                Python only
              </span>
            )}

            {fileInfo && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-gray-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Hero copy */}
        {appState === "idle" && (
          <div className="text-center space-y-2 pb-4">
            <h2 className="text-3xl font-mono font-semibold text-gray-100">
              Upload. Index. Search.{" "}
              <span className="text-neon-cyan">Instantly.</span>
            </h2>
            <p className="text-gray-500 font-mono text-sm max-w-xl mx-auto">
              Upload large logs, CSV, or text files and search them with a Python + C++ indexed
              search engine. See real p50/p95/p99 latency comparisons.
            </p>
          </div>
        )}

        {/* Upload */}
        {appState === "idle" && (
          <UploadBox onUploadSuccess={handleUploadSuccess} />
        )}

        {/* File loaded state */}
        {fileInfo && appState !== "idle" && (
          <>
            <MetricsPanel
              fileInfo={fileInfo}
              searchResult={searchResult}
              compareResult={compareResult}
              benchmarkResult={benchmarkResult}
            />

            <SearchBox
              onSearch={handleSearch}
              onBenchmark={handleBenchmark}
              loading={searchLoading}
              cppAvailable={cppAvailable}
            />

            {hasResults && searchResult && (
              <ResultsTable
                results={searchResult.results}
                query={currentQuery}
                totalMatches={searchResult.matches}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 font-mono text-xs text-gray-700">
        FlashIndex · Python + C++ · pybind11 · inverted index
      </footer>
    </div>
  );
}
