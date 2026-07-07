import { useState } from "react";
import type { Message, ChatState } from "../types";
import { analyzeFile } from "../services/api";

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
    if (!message.trim() && files.length === 0) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Format display string
    let userMessageContent = message;
    if (files.length > 0) {
      const fileNames = files.map(f => `📄 ${f.name}`).join(", ");
      userMessageContent = message 
        ? `${message}\n\n*Attached: ${fileNames}*`
        : `Uploaded: ${fileNames}`;
    }
    
    addMessage("user", userMessageContent);

    try {
      let result = "";
      if (files.length > 0) {
        result = await analyzeFile(files[0]); 
      } else {
        result = `You said: "${message}". (Standard text chat backend integration goes here!)`;
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

  return { state, sendMessage, clearError: () => setState(p => ({ ...p, error: null })) };
}