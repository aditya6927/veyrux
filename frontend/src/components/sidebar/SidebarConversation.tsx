import { MessageSquare } from "lucide-react";

interface SidebarConversationProps {
  isExpanded: boolean;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

export function SidebarConversation({
  isExpanded,
  title,
  isActive,
  onClick,
}: SidebarConversationProps) {
  return (
    <button
      onClick={onClick}
      // Fixed: changed non-existent zinc-850 to zinc-800/50 blend
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center relative group/item ${
        isActive
          ? "bg-zinc-800 text-zinc-100 font-medium"
          : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
      } ${isExpanded ? "gap-3" : "justify-center"}`}
    >
      <MessageSquare size={16} className="flex-shrink-0" />

      {isExpanded && (
        <span className="truncate pr-2">{title || "Untitled Chat"}</span>
      )}
    </button>
  );
}
