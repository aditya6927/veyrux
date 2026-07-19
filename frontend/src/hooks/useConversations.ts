import { useState, useEffect } from "react";
import type { Conversation, Message } from "@/types";
import type { ParsedFile } from "@/types/document";

const STORAGE_KEY = "veyrux_conversations";
const ACTIVE_ID_KEY = "veyrux_active_id";

function createEmptyConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Conversation",
    messages: [],
    documents: [],
  };
}

export function useConversations() {
  // 1. Initialize conversations from localStorage or fall back to a default empty one
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Normalize conversations saved before the documents field existed
          return parsed.map((conv: Conversation) => ({
            ...conv,
            documents: conv.documents ?? [],
          }));
        }
      } catch (e) {
        console.error("Failed to parse local conversations:", e);
      }
    }
    return [createEmptyConversation()];
  });

  // 2. Initialize activeId from localStorage or fall back to the first conversation
  const [activeId, setActiveId] = useState<string>(() => {
    const savedActive = localStorage.getItem(ACTIVE_ID_KEY);
    if (savedActive && conversations.some((c) => c.id === savedActive)) {
      return savedActive;
    }
    return conversations[0].id;
  });

  // 3. Persist changes to localStorage whenever conversations or activeId change
  useEffect(() => {
    // Strip temporary 'isLoading' flags before saving to localStorage so they don't persist on refresh
    const cleanConversations = conversations.map(
      ({ id, title, messages, documents }) => ({
        id,
        title,
        messages,
        documents,
      }),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanConversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  const activeConversation =
    conversations.find((conv) => conv.id === activeId) ?? conversations[0];

  function createConversation() {
    const existingEmpty = conversations.find(
      (conv) => conv.messages.length === 0,
    );
    if (existingEmpty) {
      setActiveId(existingEmpty.id);
      return;
    }

    const newConversation = createEmptyConversation();
    setConversations((prev) => [newConversation, ...prev]);
    setActiveId(newConversation.id);
  }

  // Deletion logic: select another conversation if the active one is deleted
  function deleteConversation(id: string) {
    setConversations((prev) => {
      const filtered = prev.filter((conv) => conv.id !== id);

      // If we've deleted everything, yield a fresh new conversation
      if (filtered.length === 0) {
        const fallback = createEmptyConversation();
        setActiveId(fallback.id);
        return [fallback];
      }

      // If we deleted the active chat, switch active view to the next available one
      if (id === activeId) {
        const currentIndex = prev.findIndex((conv) => conv.id === id);
        const nextActiveIndex = currentIndex === 0 ? 1 : currentIndex - 1;
        setActiveId(prev[nextActiveIndex]?.id || filtered[0].id);
      }

      return filtered;
    });
  }

  function selectConversation(id: string) {
    setActiveId(id);
  }

  function updateActiveMessages(updater: (prev: Message[]) => Message[]) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? { ...conv, messages: updater(conv.messages) }
          : conv,
      ),
    );
  }

  // Bank a newly-parsed document's chunks onto the active conversation, so
  // every future turn in it can retrieve against them - not just this one
  function addDocumentToActive(document: ParsedFile) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeId
          ? { ...conv, documents: [...conv.documents, document] }
          : conv,
      ),
    );
  }

  // Set the specific conversation loading state to resolve the global spinner bug
  function setConversationLoading(id: string, isLoading: boolean) {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, isLoading } : conv)),
    );
  }

  function updateConversationTitle(id: string, newTitle: string) {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title: newTitle } : conv,
      ),
    );
  }

  async function generateConversationTitle(id: string, firstMessage: string) {
    try {
      const cleanText = firstMessage.split("\n")[0];
      const truncatedTitle =
        cleanText.length > 25 ? cleanText.substring(0, 25) + "..." : cleanText;
      updateConversationTitle(id, truncatedTitle);
    } catch (e) {
      console.error("Failed to generate title:", e);
    }
  }

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    updateActiveMessages,
    addDocumentToActive,
    setConversationLoading,
    generateConversationTitle,
  };
}
