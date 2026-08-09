import type { Conversation, Message } from "@/types";
import type { Chunk } from "@/types/document";

const API_BASE = import.meta.env.VITE_API_URL;

/* -------------------------------------------------------------------------- */
/*                               Document API                                 */
/* -------------------------------------------------------------------------- */

/**
 * Handles file upload and analysis.
 * Hits the backend /analyze endpoint.
 */
export async function analyzeFile(
  file: File,
): Promise<{ result: string; chunks: Chunk[] }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to analyze file");
  }

  const data = await response.json();

  return {
    result: data.result,
    chunks: data.chunks ?? [],
  };
}

/* -------------------------------------------------------------------------- */
/*                           Conversation API                                 */
/* -------------------------------------------------------------------------- */

interface BackendMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface BackendConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: BackendMessage[];
}

/**
 * Maps backend message structure to the frontend Message format.
 */
function mapMessage(message: BackendMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.created_at),
  };
}

/**
 * Maps backend conversation payload to the frontend Conversation model.
 * Defaults documents array to empty during initial persistence phase.
 */
function mapConversation(conversation: BackendConversation): Conversation {
  return {
    id: conversation.id,
    title: conversation.title,
    messages: (conversation.messages || []).map(mapMessage),
    documents: [],
  };
}

/**
 * Fetch all conversations from backend storage.
 */
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/conversations/`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load conversations");
  }

  const data: BackendConversation[] = await response.json();

  return data.map(mapConversation);
}

/**
 * Create a new conversation instance on the backend.
 */
export async function createConversation(
  title = "New Conversation",
): Promise<Conversation> {
  const response = await fetch(
    `${API_BASE}/conversations/?title=${encodeURIComponent(title)}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create conversation");
  }

  const data: BackendConversation = await response.json();

  return mapConversation(data);
}

/**
 * Fetch details for a specific conversation, including message history.
 */
export async function getConversation(
  conversationId: string,
): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to load conversation");
  }

  const data: BackendConversation = await response.json();

  return mapConversation(data);
}

/**
 * Delete a conversation by ID.
 */
export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete conversation");
  }
}

/* -------------------------------------------------------------------------- */
/*                              Message API                                   */
/* -------------------------------------------------------------------------- */

interface SendConversationMessageOptions {
  conversationId: string;
  content: string;
  chunks?: Chunk[];
  groundingChunks?: Chunk[];
}

/**
 * Sends a user message to a specific conversation endpoint.
 * Backend handles history aggregation and response generation.
 */
export async function sendConversationMessage({
  conversationId,
  content,
  chunks = [],
  groundingChunks = [],
}: SendConversationMessageOptions): Promise<Message> {
  const response = await fetch(
    `${API_BASE}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        chunks: chunks.length > 0 ? chunks : undefined,
        grounding_chunks:
          groundingChunks.length > 0 ? groundingChunks : undefined,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to send message");
  }

  const data: BackendMessage = await response.json();

  return mapMessage(data);
}
