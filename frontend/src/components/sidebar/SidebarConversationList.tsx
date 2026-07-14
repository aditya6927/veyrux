import { SidebarConversation } from "./SidebarConversation";
import type { Conversation } from "@/types";

interface SidebarConversationListProps {
  isExpanded: boolean;
  conversations: Conversation[];
  activeConversationID: string | null;
  searchQuery: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void; // <-- Add onDeleteChat
}

export function SidebarConversationList({
  isExpanded,
  conversations,
  activeConversationID,
  searchQuery,
  onSelectChat,
  onDeleteChat, // <-- Accept onDeleteChat
}: SidebarConversationListProps) {
  // Completely remove the list from rendering when collapsed
  if (!isExpanded) return null;

  return (
    <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 scrollbar-thin">
      {conversations.map((chat) => (
        <SidebarConversation
          key={chat.id}
          isExpanded={isExpanded}
          title={chat.title}
          isActive={activeConversationID === chat.id}
          onClick={() => onSelectChat(chat.id)}
          onDelete={() => onDeleteChat(chat.id)} // <-- Pass it down
        />
      ))}

      {conversations.length === 0 && searchQuery && (
        <div className="text-center text-xs text-zinc-600 mt-4">
          No chats found
        </div>
      )}
    </div>
  );
}
