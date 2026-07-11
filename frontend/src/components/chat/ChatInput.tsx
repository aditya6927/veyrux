import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Paperclip, Send, Loader2, X, FileText, Image } from "lucide-react";

// Point 9: Unified payload structure for future-proofing
interface ChatInputData {
  message: string;
  files: File[];
}

interface ChatInputProps {
  onSubmit: (payload: ChatInputData) => void;
  isLoading: boolean;
  loadingStatus?: string; // Point 7: Distinguish between "Thinking...", "Reading PDF...", etc.
}

export default function ChatInput({
  onSubmit,
  isLoading,
  loadingStatus,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  // Point 3 & 10: Store attachments locally instead of uploading instantly
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Point 8: Auto-resize textarea maxed out at 160px with vertical overflow
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [message]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || isLoading) return;

    // Convert FileList to Array and filter out duplicates if needed
    const validFiles = Array.from(fileList);
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = ""; // Reset file input buffer
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    handleFiles(e.dataTransfer.files);
  }

  function removeAttachment(indexToRemove: number) {
    if (isLoading) return;
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function handleSubmit() {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && attachments.length === 0) || isLoading) return;

    // Point 9: Fire unified payload
    onSubmit({
      message: trimmedMessage,
      files: attachments,
    });

    // Clear state completely on send
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSubmit();
    }
  }

  const isSubmitDisabled =
    isLoading || (!message.trim() && attachments.length === 0);

  return (
    // Point 1: Keeps the input constrained to the central conversation column layout
    <div className="p-4 border-t border-border bg-background w-full max-w-3xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "relative flex flex-col rounded-2xl border transition-all duration-200 bg-muted/40",
          isLoading && "opacity-75 cursor-not-allowed bg-muted/20",
          isDragging && !isLoading
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-input",
          !isLoading &&
            "focus-within:bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-primary",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple // Ready for multiple attachments
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.md,.csv,.json,.xml,.html,.png,.jpg,.jpeg,.webp"
          disabled={isLoading}
        />

        {/* Point 5: Enhanced Polish Drag Overlay */}
        {isDragging && !isLoading && (
          <div className="absolute inset-0 bg-background/95 border-2 border-dashed border-primary rounded-2xl flex flex-col items-center justify-center space-y-2 text-primary pointer-events-none z-20 transition-all duration-150">
            <Paperclip className="h-8 w-8 animate-bounce" />
            <span className="text-sm font-semibold">
              Drop files here to attach
            </span>
            <span className="text-xs text-muted-foreground">
              PDF, DOCX, PNG, JPG, TXT
            </span>
          </div>
        )}

        {/* Point 4 & 10: File Preview Chips Area */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-border/30 max-h-32 overflow-y-auto">
            {attachments.map((file, idx) => {
              const isImage = file.type.startsWith("image/");
              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="group relative flex items-center gap-2 bg-background border border-input rounded-xl pl-2.5 pr-8 py-1.5 text-xs font-medium max-w-[200px] truncate animate-in fade-in zoom-in-95 duration-150"
                >
                  {isImage ? (
                    <Image className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                  <span className="truncate text-foreground/80">
                    {file.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    disabled={isLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Text Input Element */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? loadingStatus || "Analyzing..."
              : "Ask anything or drop a file..."
          }
          disabled={isLoading}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none min-h-[44px] overflow-y-auto",
            isLoading && "cursor-not-allowed select-none",
          )}
        />

        {/* Action Tray */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          {/* Left Side: Attachment Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Right Side: Micro-animated Send Action (Point 6) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={cn(
              "p-2 rounded-xl text-sm font-medium transition-all duration-150 ease-out transform active:scale-95",
              !isSubmitDisabled
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm scale-100"
                : "text-muted-foreground bg-transparent opacity-30 cursor-not-allowed scale-95",
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-1.5 px-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingStatus && (
                  <span className="text-xs font-normal animate-pulse">
                    {loadingStatus}
                  </span>
                )}
              </div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
