import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { uploadFile } from "../api";
import type { FileMetadata } from "../types";

interface Props {
  onUploadSuccess: (meta: FileMetadata) => void;
}

export default function UploadBox({ onUploadSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "log", "csv"].includes(ext ?? "")) {
      setError("Only .txt, .log, and .csv files are supported.");
      return;
    }
    setLoading(true);
    try {
      const meta = await uploadFile(file);
      onUploadSuccess(meta);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Upload failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
        transition-all duration-300 text-center select-none
        ${dragging
          ? "border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan"
          : "border-border-dim hover:border-neon-cyan/50 hover:bg-surface-3"
        }
        ${loading ? "pointer-events-none opacity-70" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.log,.csv"
        className="hidden"
        onChange={onChange}
      />

      <div className="flex flex-col items-center gap-4">
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
            <p className="font-mono text-neon-cyan text-sm">Building index…</p>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-neon-cyan/10 blur-xl" />
              <Upload
                className={`relative w-12 h-12 transition-colors ${
                  dragging ? "text-neon-cyan" : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <p className="text-gray-200 font-medium text-lg">
                Drop a file or{" "}
                <span className="text-neon-cyan">click to browse</span>
              </p>
              <p className="text-gray-500 font-mono text-sm mt-1">
                .txt · .log · .csv
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          className="mt-4 flex items-center gap-2 justify-center text-neon-pink font-mono text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
