import type { Message } from "@/types";
import type { Chunk } from "@/types/document";

const API_BASE = import.meta.env.VITE_API_URL;

/**
 * 1. RESTORED: Handles file upload/analysis (Multipart Form Data)
 * Hits the backend /analyze endpoint
 */
export async function analyzeFile(
  file: File,
): Promise<{ result: string; chunks: Chunk[] }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData, // Fetch automatically configures 'multipart/form-data' bounds
  });

  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || `Failed to analyze file`);
  }

  const data = await response.json();
  return { result: data.result, chunks: data.chunks ?? [] };
}

/**
 * 2. Handles conversational text memory (JSON Arrays), optionally grounded
 * in previously chunked/embedded documents
 * Hits the backend /chat endpoint
 */
interface ChatRequest {
  message: string;
  history: Message[];
  chunks: Chunk[];
}

export async function sendChatMessage({
  message,
  history,
  chunks,
}: ChatRequest): Promise<string> {
  // Construct the full history array including the fresh message turn
  const fullHistory = [...history, { role: "user", content: message }];

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Filter out system messages so the backend models don't crash
      messages: fullHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      // Omit entirely when empty, matching the backend's Optional[list[Chunk]] = None
      chunks: chunks.length > 0 ? chunks : undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to get chat response");
  }

  const data = await response.json();
  return data.result;
}
