import Header from "@/components/layout/Header";
import { ChatMain } from "@/components/chat/ChatMain";
import { SidebarMain } from "@/components/sidebar/SidebarMain";
import { useConversations } from "@/hooks/useConversations";

export default function App() {
  const {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    updateActiveMessages,
    addDocumentToActive,
    setConversationLoading,
    generateConversationTitle,
  } = useConversations();

  // Every document attached to this conversation contributes its chunks to
  // retrieval - doesn't matter which upload turn they came from
  const activeChunks = activeConversation.documents.flatMap(
    (doc) => doc.chunks,
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <SidebarMain
        conversations={conversations}
        activeConversationID={activeId}
        onSelectChat={selectConversation}
        onNewChat={createConversation}
        onDeleteChat={deleteConversation} // <-- 1. Exposing deletion to Sidebar
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />

        <ChatMain
          activeConversationId={activeId} // <-- 2. Send activeId down
          messages={activeConversation.messages}
          isLoading={!!activeConversation.isLoading} // <-- 3. Pass conversation-bound loading state
          chunks={activeChunks}
          onUpdateMessages={updateActiveMessages}
          onSetLoading={setConversationLoading} // <-- 4. Pass down the loader updater
          onAddDocument={addDocumentToActive}
          onGenerateTitle={generateConversationTitle}
        />
      </div>
    </div>
  );
}
