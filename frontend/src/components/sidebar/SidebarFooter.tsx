import { Settings } from "lucide-react";

interface SidebarFooterProps {
  isExpanded: boolean;
}

export function SidebarFooter({ isExpanded }: SidebarFooterProps) {
  return (
    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
      <button
        className={`w-full flex items-center p-2 hover:bg-zinc-800 rounded-lg text-left transition-all group/footer ${
          isExpanded ? "gap-3 justify-between" : "justify-center"
        }`}
        title="Account & Settings"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* user initials avatar */}
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-200 group-hover/footer:border-zinc-500 border border-transparent flex-shrink-0 transition-colors">
            A
          </div>

          {/* user account text meta */}
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate leading-tight">
                Aditya
              </p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                Profile Info
              </p>
            </div>
          )}
        </div>

        {isExpanded && (
          <Settings
            size={16}
            className="text-zinc-500 group-hover/footer:text-zinc-300 transition-colors"
          />
        )}
      </button>
    </div>
  );
}
