import { useState } from "react";
import type { Message, ChatState } from "../types";
import { analyzeFile, sendChatMessage } from "../services/api";

interface ChatSubmitPayload {
  message: string;
  files: File[];
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  function addMessage(role: Message["role"], content: string) {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
  }

  async function sendMessage(payload: ChatSubmitPayload) {
    const { message, files } = payload;

    // Guard check: don't submit if completely empty
    if (!message.trim() && files.length === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Dynamic formatting for the UI bubble text
    let userMessageContent = message;

    if (files.length > 0) {
      const fileNames = files.map((f) => `📄 ${f.name}`).join(", ");
      // If user wrote text + file, show both. If just file, show "Uploaded: file.pdf"
      userMessageContent = message
        ? `${message}\n\n*Attached: ${fileNames}*`
        : `Uploaded: ${fileNames}`;
    }

    // Pass the styled content string to your screen state!
    addMessage("user", userMessageContent);

    try {
      let result = "";

      if (files.length > 0) {
        // Keep using your old file endpoint for now if files are dropped
        result = await analyzeFile(files[0]);
      } else {
        // Pass the current state.messages down so the API wrapper can append and filter it
        result = await sendChatMessage({
          message,
          files,
          history: state.messages,
        });
      }

      addMessage("assistant", result);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  return {
    state,
    sendMessage,
    clearError: () => setState((p) => ({ ...p, error: null })),
  };
}
