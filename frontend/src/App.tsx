import { useState } from "react";
import Header from "@/components/layout/Header";
import { ChatMain } from "@/components/chat/ChatMain";
import {
  type Conversation,
  SidebarMain,
} from "@/components/sidebar/SidebarMain";

// 1. Temporary dummy conversations to style and verify the layout
const DUMMY_CONVERSATIONS: Conversation[] = [
  { id: "1", title: "Verilog Overview & FPGA Implementation" },
  { id: "2", title: "Resume Review" },
  { id: "3", title: "Graph Algorithms" },
  { id: "4", title: "Veyrux Core Ideas" },
  { id: "5", title: "Operating Systems Notes" },
];

export default function App() {
  // 2. Local state for mock UI integration testing
  const [activeId, setActiveId] = useState<string | null>("1");
  const [conversations, setConversations] =
    useState<Conversation[]>(DUMMY_CONVERSATIONS);

  const handleSelectChat = (id: string) => {
    setActiveId(id);
  };

  const handleNewChat = () => {
    const newChat: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
    };
    setConversations([newChat, ...conversations]);
    setActiveId(newChat.id);
  };

  return (
    // Base layout: Row container wrapper encompassing the entire screen
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* LEFT: Mount the sidebar */}
      <SidebarMain
        conversations={conversations}
        activeConversationID={activeId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      {/* RIGHT: Layout Group with Header + Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Your separate Header file remains anchored here */}
        <Header />

        {/* The isolated core messaging component */}
        <ChatMain />
      </div>
    </div>
  );
}
