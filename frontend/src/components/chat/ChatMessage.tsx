import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start",
        isSystem ? "justify-center" : "",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
          isUser && "bg-primary text-primary-foreground rounded-br-sm",
          !isUser && !isSystem && "bg-muted text-foreground rounded-bl-sm",
          isSystem && "bg-transparent text-muted-foreground text-xs italic",
        )}
      >
        {isUser || isSystem ? (
          message.content
        ) : (
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mb-2">{children}</h3>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="bg-black/20 rounded px-1 text-xs font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
