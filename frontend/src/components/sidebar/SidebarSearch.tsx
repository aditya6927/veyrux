import { Search } from "lucide-react";

interface SidebarSearchProps {
  isExpanded: boolean;
  value: string;
  onChange: (val: string) => void;
}

export function SidebarSearch({
  isExpanded,
  value,
  onChange,
}: SidebarSearchProps) {
  // Collapsed State with CSS Tooltip
  if (!isExpanded) {
    return (
      <div className="relative group/tooltip flex justify-center p-3 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">
        <Search size={16} />

        {/* Lightweight Tailwind Tooltip */}
        <span className="absolute left-14 top-1/2 -translate-y-1/2 scale-0 group-hover/tooltip:scale-100 group-hover/tooltip:delay-300 transition-all duration-150 origin-left bg-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 pointer-events-none border border-zinc-700 shadow-xl font-medium">
          Search chats
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 mb-2">
      <div className="relative flex items-center">
        <Search
          size={14}
          className="absolute left-2.5 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search chats"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 placeholder-zinc-600 transition-colors"
        />
      </div>
    </div>
  );
}
