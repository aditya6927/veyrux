import { useState } from "react";
import type { Message } from "@/types";
import type { Chunk, ParsedFile } from "@/types/document";
import { analyzeFile, sendConversationMessage } from "@/services/api";

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

  async function sendMessage(payload: SendMessageOptions) {
    const { message, files } = payload;
    const trimmedMessage = message.trim();

    if (!trimmedMessage && files.length === 0) return;

    const isFirstTurn = messages.length === 0;

    setLoading(conversationId, true);
    setError(null);

    /**
     * Trigger temporary frontend title generation on the first turn.
     */
    if (isFirstTurn && onGenerateTitle && trimmedMessage) {
      onGenerateTitle(conversationId, trimmedMessage);
    }

    try {
      if (files.length > 0) {
        /**
         * Analyze attached files via local pipeline.
         */
        const analyses = await Promise.all(
          files.map((file) => analyzeFile(file)),
        );

        analyses.forEach((analysis, i) =>
          onAddDocument({
            filename: files[i].name,
            chunks: analysis.chunks,
          }),
        );

        const newChunks = analyses.flatMap((analysis) => analysis.chunks);
        const combinedChunks = [...chunks, ...newChunks];

        if (trimmedMessage) {
          const { userMessage, assistantMessage } =
            await sendConversationMessage({
              conversationId,
              content: trimmedMessage,
              chunks: combinedChunks,
              groundingChunks: newChunks,
            });

          setMessages((prev) => [...prev, userMessage, assistantMessage]);
        } else {
          /**
           * Local document summary response for promptless file uploads.
           */
          const summaryText =
            analyses.length === 1
              ? analyses[0].result
              : analyses
                  .map(
                    (analysis, i) =>
                      `## ${files[i].name}\n\n${analysis.result}`,
                  )
                  .join("\n\n---\n\n");

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: summaryText,
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        /**
         * Standard message turn. PostgreSQL handles message persistence.
         */
        const { userMessage, assistantMessage } = await sendConversationMessage(
          {
            conversationId,
            content: trimmedMessage,
            chunks,
          },
        );

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(conversationId, false);
    }
  }

  return {
    state: {
      messages,
      isLoading,
      error,
    },
    sendMessage,
    clearError: () => setError(null),
  };
}
