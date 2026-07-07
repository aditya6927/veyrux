import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Sparkles, User } from "lucide-react"; // Nice luxury visual identifiers

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center w-full my-2">
        <div className="bg-muted/30 text-muted-foreground text-xs px-3 py-1.5 rounded-full italic border border-border/40">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-4 w-full group py-2")}>
      {/* Identity Avatar Icon Badge */}
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-medium select-none shadow-sm",
          isUser
            ? "bg-background border-border text-foreground"
            : "bg-primary text-primary-foreground border-primary/20",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          // alternative ? no sparkles
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Message content wrapper */}
      <div className="flex-1 space-y-1.5 pt-1 overflow-hidden">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {isUser ? "You" : "Veyrux"}
        </div>

        <div className="text-sm leading-relaxed text-foreground/90 selection:bg-primary/20">
          {isUser ? (
            // User prompts stay formatting-safe but plain
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            // Full Markdown suite layout for the AI
            <div className="prose prose-sm dark:prose-invert max-w-none break-words space-y-2.5">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold tracking-tight text-foreground mt-4 mb-1">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold tracking-tight text-foreground mt-3 mb-1">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xs font-semibold text-foreground mt-2 mb-1">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-7 first:mt-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-2 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-2 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="marker:text-muted-foreground">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-medium text-foreground border border-border/40">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
