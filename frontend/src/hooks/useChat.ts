import { useState } from "react";
import type { Message } from "@/types";
import { analyzeFile, sendChatMessage } from "@/services/api";

interface SendMessageOptions {
  message: string;
  files: File[];
}

export function useChat(
  activeConversationId: string,
  messages: Message[],
  isLoading: boolean,
  setMessages: (updater: (prev: Message[]) => Message[]) => void,
  setLoading: (id: string, loading: boolean) => void,
  onGenerateTitle?: (id: string, firstMessage: string) => void,
) {
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

    // Set loading for *only* this specific active conversation
    setLoading(activeConversationId, true);
    setError(null);

    let userMessageContent = message;
    if (files.length > 0) {
      const fileNames = files.map((f) => `📄 ${f.name}`).join(", ");
      userMessageContent = message
        ? `${message}\n\n*Attached: ${fileNames}*`
        : `Uploaded: ${fileNames}`;
    }

    addMessage("user", userMessageContent);

    // If it's the first message, trigger title generation in the background
    if (isFirstMessage && onGenerateTitle && message.trim()) {
      onGenerateTitle(activeConversationId, message);
    }

    try {
      let result = "";
      if (files.length > 0) {
        result = await analyzeFile(files[0]);
      } else {
        result = await sendChatMessage({
          message,
          files,
          history: messages,
        });
      }

      addMessage("assistant", result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      // Turn off loading specifically for this conversation
      setLoading(activeConversationId, false);
    }
  }

  return {
    state: { messages, isLoading, error },
    sendMessage,
    clearError: () => setError(null),
  };
}
