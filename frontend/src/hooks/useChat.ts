import { useState } from "react";
import type { Message } from "@/types";
import type { Chunk, ParsedFile } from "@/types/document";
import { analyzeFile, sendChatMessage } from "@/services/api";

interface SendMessageOptions {
  message: string;
  files: File[];
}

interface UseChatOptions {
  conversationId: string;
  messages: Message[];
  isLoading: boolean;
  chunks: Chunk[];
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  setLoading: (id: string, loading: boolean) => void;
  onAddDocument: (document: ParsedFile) => void;
  onGenerateTitle?: (id: string, firstMessage: string) => void;
}

export function useChat({
  conversationId,
  messages,
  isLoading,
  chunks,
  setMessages,
  setLoading,
  onAddDocument,
  onGenerateTitle,
}: UseChatOptions) {
  const [error, setError] = useState<string | null>(null);

  function addMessage(role: Message["role"], content: string) {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }

  async function sendMessage(payload: SendMessageOptions) {
    const { message, files } = payload;

    if (!message.trim() && files.length === 0) return;

    const isFirstMessage = messages.length === 0;

    // Set loading for the specific active conversation
    setLoading(conversationId, true);
    setError(null);

    let userMessageContent = message;
    if (files.length > 0) {
      const fileNames = files.map((f) => `📄 ${f.name}`).join(", ");
      userMessageContent = message
        ? `${message}\n\n*Attached: ${fileNames}*`
        : `Uploaded: ${fileNames}`;
    }

    addMessage("user", userMessageContent);

    // Trigger title generation in the background on the first message turn
    if (isFirstMessage && onGenerateTitle && message.trim()) {
      onGenerateTitle(conversationId, message);
    }

    try {
      let result = "";

      if (files.length > 0) {
        // Parse, chunk, and embed the file, banking chunks on the conversation
        const { result: summary, chunks: newChunks } = await analyzeFile(
          files[0],
        );
        onAddDocument({ filename: files[0].name, chunks: newChunks });

        if (message.trim()) {
          // Answer specific questions grounded in the context chunks
          result = await sendChatMessage({
            message,
            history: messages,
            chunks: [...chunks, ...newChunks],
          });
        } else {
          // Default to the full document summary when no specific question is asked
          result = summary;
        }
      } else {
        // Standard text turn grounded in the existing uploaded context chunks
        result = await sendChatMessage({ message, history: messages, chunks });
      }

      addMessage("assistant", result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      // Clear loading specifically for this conversation
      setLoading(conversationId, false);
    }
  }

  return {
    state: { messages, isLoading, error },
    sendMessage,
    clearError: () => setError(null),
  };
}
