import type { ParsedFile } from "./document";

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  context?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  documents: ParsedFile[]; // Track multiple files per conversation cleanly
  isLoading?: boolean; // Handles conversation-specific loaders
}
