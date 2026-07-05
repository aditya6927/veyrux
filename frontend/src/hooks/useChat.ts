import { useState } from "react";
import type { Message, ChatState } from "../types";
import { analyzeFile } from "../services/api";

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

    setState((prevState) => ({
      ...prevState,
      messages: [...prevState.messages, newMessage],
    }));
  }

  async function sendFile(file: File) {
    addMessage("user", `Uploading file: ${file.name}`);
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

    try {
      const result = await analyzeFile(file);
      addMessage("assistant", `${result}`);
    } catch (err: any) {
      setState((prevState) => ({
        ...prevState,
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  }

  function clearError() {
    setState((prevState) => ({ ...prevState, error: null }));
  }

  return { state, addMessage, sendFile, clearError };
}
