import { PanelLeftClose, PanelLeft } from "lucide-react";

interface SidebarHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ isExpanded, onToggle }: SidebarHeaderProps) {
  return (
    <div className="p-4 flex items-center justify-between border-b border-zinc-800 h-14">
      {/* Explicitly hide title if collapsed instead of letting it squeeze */}
      {isExpanded && (
        <span className="font-semibold text-zinc-100 tracking-wide bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          Veyrux
        </span>
      )}

      {/* Wrap the button or use relative on the button itself to host the tooltip */}
      <button
        onClick={onToggle}
        className={`relative group/tooltip p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-200 ${
          !isExpanded ? "mx-auto" : ""
        }`}
      >
        {isExpanded ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}

        {/* Smart Tooltip with micro-delay matching the other components */}
        <span
          className={`absolute scale-0 group-hover/tooltip:scale-100 group-hover/tooltip:delay-300 transition-all duration-150 bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 pointer-events-none border border-zinc-700 shadow-xl font-medium ${
            isExpanded
              ? "top-10 right-0 origin-top-right" // Position below the button when expanded
              : "left-14 top-1/2 -translate-y-1/2 origin-left" // Position to the right when collapsed
          }`}
        >
          {isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        </span>
      </button>
    </div>
  );
}
