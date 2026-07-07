import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            What can I help with today?
          </h2>
          <p className="text-sm text-muted-foreground">
            Ask a question, upload a document, analyze snippets, or images to
            get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-6 space-y-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Balanced, clean typing/thinking indicator */}
      {isLoading && (
        <div className="flex justify-start items-center gap-3 animate-in fade-in duration-200">
          <div className="text-xs font-medium text-muted-foreground animate-pulse">
            Veyrux is thinking
          </div>
          <div className="flex gap-1 items-center">
            <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
