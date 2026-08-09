import { useEffect, useState } from "react";
import type { Conversation, Message } from "@/types";
import type { ParsedFile } from "@/types/document";
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
   * Creates an initial conversation if the backend store is empty.
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
   * Reuses an active empty conversation if available.
   */
  async function createConversation() {
    const existingEmpty = conversations.find(
      (conv) => conv.messages && conv.messages.length === 0,
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
   * Deletes a conversation by ID from backend storage and updates state.
   */
  async function deleteConversation(id: string) {
    try {
      await deleteConversationAPI(id);

      const filtered = conversations.filter((conv) => conv.id !== id);

      if (filtered.length === 0) {
        const fallback = await createConversationAPI();
        setConversations([fallback]);
        setActiveId(fallback.id);
        return;
      }

      setConversations(filtered);

      if (id === activeId) {
        const currentIndex = conversations.findIndex((conv) => conv.id === id);
        const nextIndex = currentIndex === 0 ? 1 : currentIndex - 1;
        const nextActive = conversations[nextIndex] ?? filtered[0];

        setActiveId(nextActive.id);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }

  function selectConversation(id: string) {
    setActiveId(id);
  }

  /**
   * Temporary message updater for active conversation state.
   */
  function updateActiveMessages(updater: (prev: Message[]) => Message[]) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? { ...conv, messages: updater(conv.messages) }
          : conv,
      ),
    );
  }

  /**
   * Appends uploaded parsed files to active conversation state.
   */
  function addDocumentToActive(document: ParsedFile) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? {
              ...conv,
              documents: [...conv.documents, document],
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
   * Temporary frontend title update helper.
   */
  function updateConversationTitle(id: string, newTitle: string) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle } : conv,
      ),
    );
  }

  /**
   * Generates a title derived from the first user message text.
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
