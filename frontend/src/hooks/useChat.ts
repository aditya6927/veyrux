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
        // 1. Send the file to be extracted into raw text by the backend parser
        const extractedDocumentText = await analyzeFile(files[0]);

        // 2. Wrap that extracted text into a structured prompt context block
        const contextualMessage = `[Document Context Attached]\n${extractedDocumentText}\n\n[End of Context]\nBased on the document context provided above, please handle the following request: ${message || "Provide an overall detailed summary of this file."}`;

        // 3. Send the contextual text stream straight to the conversational history chat endpoint
        result = await sendChatMessage({
          message: contextualMessage,
          files: [], // Clear out since it's already contextualized
          history: messages,
        });
      } else {
        // Standard text interaction pipeline
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
