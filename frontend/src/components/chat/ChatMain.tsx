import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import type { Message } from "@/types";
import type { Chunk, ParsedFile } from "@/types/document";

interface ChatMainProps {
  activeConversationId: string;
  messages: Message[];
  isLoading: boolean;
  chunks: Chunk[];
  onUpdateMessages: (updater: (prev: Message[]) => Message[]) => void;
  onSetLoading: (id: string, loading: boolean) => void;
  onAddDocument: (document: ParsedFile) => void;
  onGenerateTitle: (id: string, firstMessage: string) => void;
}

export function ChatMain({
  activeConversationId,
  messages,
  isLoading,
  chunks,
  onUpdateMessages,
  onSetLoading,
  onAddDocument,
  onGenerateTitle,
}: ChatMainProps) {
  // Pass the conversation-specific loading state and updater directly to our custom hook
  const { state, sendMessage } = useChat({
    conversationId: activeConversationId,
    messages,
    isLoading,
    chunks,
    setMessages: onUpdateMessages,
    setLoading: onSetLoading,
    onAddDocument,
    onGenerateTitle,
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
      {/* 1. Middle Message Feed Container */}
      <div className="flex-1 overflow-y-auto w-full min-h-0 scrollbar-thin">
        <div className="mx-auto max-w-3xl h-full flex flex-col">
          <ChatWindow messages={state.messages} isLoading={state.isLoading} />
        </div>
      </div>

      {/* 2. Bottom Dispatch Box */}
      <div className="w-full pb-4 flex-shrink-0">
        <ChatInput onSubmit={sendMessage} isLoading={state.isLoading} />
        {state.error && (
          <div className="max-w-3xl mx-auto px-4 mt-2 text-xs text-destructive text-center">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
