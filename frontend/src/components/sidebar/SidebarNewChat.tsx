import { SquarePen } from "lucide-react";

interface SidebarNewChatProps {
  isExpanded: boolean;
  onNewChat: () => void;
}

export function SidebarNewChat({ isExpanded, onNewChat }: SidebarNewChatProps) {
  return (
    <div className="p-3">
      <button
        onClick={onNewChat}
        // Added 'relative group/tooltip' to anchor the tooltip correctly
        className={`w-full flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700/70 border-zinc-100 rounded-lg py-2 text-sm font-medium transition-all shadow-sm relative group/tooltip ${
          isExpanded ? "px-3 justify-start" : "p-2 justify-center"
        }`}
      >
        <SquarePen size={16} className="flex-shrink-0" />

        {isExpanded ? (
          <span className="text-xs tracking-wide">New Chat</span>
        ) : (
          // Exact same matching tooltip setup with a premium 300ms hover delay
          <span className="absolute left-14 top-1/2 -translate-y-1/2 scale-0 group-hover/tooltip:scale-100 group-hover/tooltip:delay-300 transition-all duration-150 origin-left bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 pointer-events-none border border-zinc-700 shadow-xl font-medium">
            New Chat
          </span>
        )}
      </button>
    </div>
  );
}
