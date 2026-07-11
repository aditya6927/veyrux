import { useState } from "react";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNewChat } from "./SidebarNewChat";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarConversationList } from "./SidebarConversationList";
import { SidebarFooter } from "./SidebarFooter";

// 1. Defined a proper conversation interface instead of any[]
export interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationID: string | null;
  onSelectChat: (conversationId: string) => void;
  onNewChat: () => void;
}

export function SidebarMain({
  conversations,
  activeConversationID,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  const filteredConversations = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`h-screen bg-zinc-900 border-r border-zinc-800 text-zinc-200 flex flex-col transition-all duration-300 select-none z-[60] ${
        isExpanded ? "w-72" : "w-16"
      }`}
    >
      {/* 1. HEADER */}
      <SidebarHeader isExpanded={isExpanded} onToggle={toggleSidebar} />

      {/* 2. NEW CHAT */}
      <SidebarNewChat isExpanded={isExpanded} onNewChat={onNewChat} />

      {/* 3. SEARCH */}
      <SidebarSearch
        isExpanded={isExpanded}
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {/* 4. CONVERSATIONS LIST */}
      <SidebarConversationList
        isExpanded={isExpanded}
        conversations={filteredConversations}
        activeConversationID={activeConversationID}
        searchQuery={searchQuery}
        onSelectChat={onSelectChat}
      />

      {/* 5. DYNAMIC SPACER: Pushes the footer down when the conversation list is hidden */}
      {!isExpanded && <div className="flex-1" />}

      {/* 6. FOOTER */}
      <SidebarFooter isExpanded={isExpanded} />
    </div>
  );
}
