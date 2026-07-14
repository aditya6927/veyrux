import { MessageSquare, Trash2 } from "lucide-react";

interface SidebarConversationProps {
  isExpanded: boolean;
  title: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function SidebarConversation({
  isExpanded,
  title,
  isActive,
  onClick,
  onDelete,
}: SidebarConversationProps) {
  return (
    // 1. Change the outer container from <button> to a <div>
    <div
      className={`w-full text-left rounded-lg text-sm transition-all flex items-center relative group/item ${
        isActive
          ? "bg-zinc-800 text-zinc-100 font-medium"
          : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
      } ${isExpanded ? "gap-3" : "justify-center"}`}
    >
      {/* 2. Wrap the clickable chat label area in a semantic, non-nested click handler */}
      <div
        onClick={onClick}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 cursor-pointer min-w-0"
      >
        <MessageSquare size={16} className="flex-shrink-0" />

        {isExpanded && (
          <span className="truncate pr-8 flex-1">
            {title || "Untitled Chat"}
          </span>
        )}
      </div>

      {/* 3. The delete button is now perfectly legal to render since it lives inside a <div> instead of another <button> */}
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-3 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition-all z-10"
          title="Delete Conversation"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
