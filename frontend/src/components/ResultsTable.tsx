import { useState, useEffect } from "react";
import { FileSearch } from "lucide-react";
import type { SearchResult } from "../types";

interface Props {
  results: SearchResult[];
  query: string;
  totalMatches: number;
}

function highlight(text: string, query: string): React.ReactNode {
  const tokens = query.toLowerCase().match(/[a-z0-9]+/g);
  if (!tokens || tokens.length === 0) return text;
  const pattern = tokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  const re = new RegExp(`^(${pattern})$`, "i");
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-neon-pink/20 text-neon-pink rounded px-0.5 not-italic">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const PAGE_SIZE = 50;

export default function ResultsTable({ results, query, totalMatches }: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [results]);

  const visible = results.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < results.length;

  if (results.length === 0) {
    return (
      <div className="card-base p-10 flex flex-col items-center gap-3 text-center">
        <FileSearch className="w-10 h-10 text-gray-700" />
        <p className="font-mono text-gray-600 text-sm">No matches found</p>
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-dim">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Results</p>
        <p className="font-mono text-xs text-neon-pink">
          {totalMatches.toLocaleString()} match{totalMatches !== 1 ? "es" : ""}
          {totalMatches > results.length && ` (showing first ${results.length})`}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-dim bg-surface-3">
              <th className="text-left px-4 py-2 font-mono text-xs text-gray-600 uppercase tracking-widest w-20">
                Line
              </th>
              <th className="text-left px-4 py-2 font-mono text-xs text-gray-600 uppercase tracking-widest">
                Text
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.line_number}
                className="border-b border-border-dim/50 hover:bg-surface-3 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600 tabular-nums align-top">
                  {row.line_number + 1}
                </td>
                <td className="px-4 py-2.5 font-mono text-sm text-gray-300 break-all">
                  {highlight(row.text, query)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="px-5 py-3 border-t border-border-dim text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="font-mono text-xs text-neon-cyan hover:text-white transition-colors"
          >
            Load more ({results.length - visible.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
