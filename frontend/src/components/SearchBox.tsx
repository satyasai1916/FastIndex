import { Search, Loader2, Zap } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import type { EngineMode } from "../types";

interface Props {
  onSearch: (query: string, engine: EngineMode) => void;
  onBenchmark: (query: string, iterations: number) => void;
  loading: boolean;
  cppAvailable: boolean;
}

const ENGINE_OPTIONS: { value: EngineMode; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "compare", label: "Compare" },
];

export default function SearchBox({ onSearch, onBenchmark, loading, cppAvailable }: Props) {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState<EngineMode>(cppAvailable ? "compare" : "python");
  const [benchmarkMode, setBenchmarkMode] = useState(false);
  const [iterations, setIterations] = useState(500);

  // If C++ becomes unavailable (e.g. Python-only file uploaded after a C++ one),
  // snap back to "python" so the active pill is never a disabled option.
  useEffect(() => {
    if (!cppAvailable && (engine === "cpp" || engine === "compare")) {
      setEngine("python");
    }
  }, [cppAvailable]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    if (benchmarkMode) {
      onBenchmark(query.trim(), iterations);
    } else {
      onSearch(query.trim(), engine);
    }
  };

  return (
    <div className="card-base p-5 space-y-4">
      {/* Engine selector */}
      <div className="flex gap-2">
        {ENGINE_OPTIONS.map((opt) => {
          const disabled = !cppAvailable && (opt.value === "cpp" || opt.value === "compare");
          const active = engine === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => !disabled && setEngine(opt.value)}
              disabled={disabled}
              className={`
                px-4 py-1.5 rounded-full font-mono text-xs font-medium transition-all duration-200
                ${active
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 shadow-neon-cyan"
                  : disabled
                  ? "text-gray-600 border border-border-dim cursor-not-allowed"
                  : "text-gray-400 border border-border-dim hover:border-neon-cyan/30 hover:text-gray-200"
                }
              `}
            >
              {opt.label}
              {disabled && " (unavailable)"}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keyword…"
            disabled={loading}
            className="
              w-full pl-10 pr-4 py-3 rounded-xl
              bg-surface-3 border border-border-dim
              font-mono text-sm text-gray-100 placeholder-gray-600
              focus:outline-none focus:border-neon-cyan/60 focus:ring-1 focus:ring-neon-cyan/30
              transition-all duration-200 disabled:opacity-50
            "
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="
            px-5 py-3 rounded-xl font-mono text-sm font-medium
            bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40
            hover:bg-neon-cyan/20 hover:shadow-neon-cyan
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center gap-2
          "
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {benchmarkMode ? "Benchmark" : "Search"}
        </button>
      </form>

      {/* Benchmark toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setBenchmarkMode(!benchmarkMode)}
          className={`
            flex items-center gap-2 text-xs font-mono transition-colors
            ${benchmarkMode ? "text-neon-purple" : "text-gray-600 hover:text-gray-400"}
          `}
        >
          <span
            className={`
              w-8 h-4 rounded-full transition-colors relative
              ${benchmarkMode ? "bg-neon-purple/40 border border-neon-purple/60" : "bg-surface-3 border border-border-dim"}
            `}
          >
            <span
              className={`
                absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200
                ${benchmarkMode ? "left-4 bg-neon-purple" : "left-0.5 bg-gray-600"}
              `}
            />
          </span>
          Benchmark mode
        </button>

        {benchmarkMode && (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>iterations:</span>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Math.max(10, Math.min(5000, Number(e.target.value))))}
              className="
                w-20 px-2 py-0.5 rounded-md
                bg-surface-3 border border-border-dim
                text-gray-200 text-xs font-mono
                focus:outline-none focus:border-neon-purple/50
              "
            />
          </div>
        )}
      </div>
    </div>
  );
}
