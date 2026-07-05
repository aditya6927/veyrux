import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendFile: (file: File) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendFile, isLoading }: ChatInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
      e.target.value = ""; // reset so same file can be uploaded again
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSendFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
    <div className="border-t border-border p-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.md,.csv,.json,.xml,.html,.png,.jpg,.jpeg,.webp"
          disabled={isLoading}
        />

        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Analyzing..."
            : isDragging
              ? "Drop to upload"
              : "Drop a file here or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          PDF, DOCX, images, text — up to 10MB
        </p>
      </div>
    </div>
  );
}
