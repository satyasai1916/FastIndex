import axios from "axios";
import type {
  BenchmarkResponse,
  CompareResponse,
  FileMetadata,
  SearchResponse,
} from "./types";

const client = axios.create({
  baseURL: "/api",
  timeout: 120_000,
});

export async function uploadFile(file: File): Promise<FileMetadata> {
  const form = new FormData();
  form.append("file", file);
  // Do NOT set Content-Type manually — axios infers it with the correct multipart boundary
  const { data } = await client.post<FileMetadata>("/files/upload", form);
  return data;
}

export async function searchFile(
  fileId: string,
  query: string,
  engine: "python" | "cpp" | "both",
  limit = 100
): Promise<SearchResponse> {
  const { data } = await client.get<SearchResponse>(
    `/files/${fileId}/search`,
    { params: { q: query, engine, limit } }
  );
  return data;
}

export async function compareSearch(
  fileId: string,
  query: string
): Promise<CompareResponse> {
  const { data } = await client.get<CompareResponse>(
    `/files/${fileId}/compare`,
    { params: { q: query } }
  );
  return data;
}

export async function benchmarkSearch(
  fileId: string,
  query: string,
  iterations: number,
  engine: "python" | "cpp" | "both"
): Promise<BenchmarkResponse> {
  const { data } = await client.post<BenchmarkResponse>(
    `/files/${fileId}/benchmark`,
    { query, iterations, engine }
  );
  return data;
}

export async function healthCheck(): Promise<{ status: string; cpp_available: boolean }> {
  const { data } = await client.get("/health");
  return data;
}
