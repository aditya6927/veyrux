import { useEffect, useState } from "react";
import type { Conversation, Message } from "@/types";
import type { Document } from "@/types/document";
import {
  createConversation as createConversationAPI,
  deleteConversation as deleteConversationAPI,
  getConversations,
} from "@/services/api";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Loads existing conversations on application startup.
   * Creates an initial conversation if backend store is empty or fails.
   */
  useEffect(() => {
    async function loadConversations() {
      try {
        setIsLoading(true);

        let loadedConversations = await getConversations();

        if (loadedConversations.length === 0) {
          const newConversation = await createConversationAPI();
          loadedConversations = [newConversation];
        }

        setConversations(loadedConversations);
        setActiveId(loadedConversations[0].id);
      } catch (error) {
        console.error("Failed to load conversations:", error);
        // Fallback to local session creation if backend fetch fails
        try {
          const fallback = await createConversationAPI();
          setConversations([fallback]);
          setActiveId(fallback.id);
        } catch (fallbackError) {
          console.error(
            "Critical: Failed to create fallback conversation:",
            fallbackError,
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, []);

  const activeConversation =
    conversations.find((conv) => conv.id === activeId) ?? null;

  /**
   * Creates a new conversation record on the backend.
   * Reuses an active empty conversation only if it has NO messages and NO attached documents.
   */
  async function createConversation() {
    const existingEmpty = conversations.find(
      (conv) =>
        (!conv.messages || conv.messages.length === 0) &&
        (!conv.documents || conv.documents.length === 0),
    );

    if (existingEmpty) {
      setActiveId(existingEmpty.id);
      return;
    }

    try {
      const newConversation = await createConversationAPI();

      setConversations((prev) => [newConversation, ...prev]);
      setActiveId(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  }

  /**
   * Deletes a conversation by ID from backend storage and safely selects the next tab.
   */
  async function deleteConversation(id: string) {
    try {
      await deleteConversationAPI(id);

      const currentIndex = conversations.findIndex((conv) => conv.id === id);
      const filtered = conversations.filter((conv) => conv.id !== id);

      if (filtered.length === 0) {
        const fallback = await createConversationAPI();
        setConversations([fallback]);
        setActiveId(fallback.id);
        return;
      }

      setConversations(filtered);

      if (id === activeId) {
        // Safely select adjacent item from filtered array
        const nextIndex = Math.min(currentIndex, filtered.length - 1);
        setActiveId(filtered[nextIndex].id);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }

  function selectConversation(id: string) {
    setActiveId(id);
  }

  /**
   * Message updater for active conversation state.
   */
  function updateActiveMessages(updater: (prev: Message[]) => Message[]) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? { ...conv, messages: updater(conv.messages || []) }
          : conv,
      ),
    );
  }

  /**
   * Appends uploaded documents to active conversation state.
   */
  function addDocumentToActive(document: Document) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? {
              ...conv,
              documents: [...(conv.documents || []), document],
            }
          : conv,
      ),
    );
  }

  function setConversationLoading(id: string, isLoading: boolean) {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, isLoading } : conv)),
    );
  }

  /**
   * Updates title in UI state.
   */
  function updateConversationTitle(id: string, newTitle: string) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle } : conv,
      ),
    );
  }

  /**
   * Generates title derived from the first message string.
   */
  function generateConversationTitle(id: string, firstMessage: string) {
    const cleanText = firstMessage.split("\n")[0];
    const truncatedTitle =
      cleanText.length > 25 ? cleanText.substring(0, 25) + "..." : cleanText;

    updateConversationTitle(id, truncatedTitle);
  }

  return {
    conversations,
    activeId,
    activeConversation,
    isLoading,
    createConversation,
    selectConversation,
    deleteConversation,
    updateActiveMessages,
    addDocumentToActive,
    setConversationLoading,
    generateConversationTitle,
  };
}
