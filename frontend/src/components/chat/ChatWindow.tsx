import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import type { ParsedFile } from "@/types/document";
import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
  messages: Message[];
  documents: ParsedFile[];
  isLoading: boolean;
}

export default function ChatWindow({
  messages,
  documents,
  isLoading,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, documents]);

  if (messages.length === 0 && documents.length === 0) {
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
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Documents
          </div>

          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id ?? document.filename}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs font-medium uppercase">
                  {document.documentType?.slice(0, 3) ?? "DOC"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {document.filename}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {document.chunks.length}{" "}
                    {document.chunks.length === 1 ? "chunk" : "chunks"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

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
