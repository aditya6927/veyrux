import Header from "@/components/layout/Header";
import { ChatMain } from "@/components/chat/ChatMain";
import { SidebarMain } from "@/components/sidebar/SidebarMain";
import { useConversations } from "@/hooks/useConversations";

export default function App() {
  const {
    conversations,
    activeId,
    activeConversation,
    isLoading,
    createConversation,
    selectConversation,
    deleteConversation,
    updateActiveMessages,
    addDocumentToActive,
    setConversationLoading,
    generateConversationTitle,
  } = useConversations();

  // Wait for conversations to load before accessing activeConversation.
  if (isLoading || !activeConversation || !activeId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  // Every document attached to this conversation contributes its chunks to
  // retrieval - doesn't matter which upload turn they came from.
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
        onDeleteChat={deleteConversation}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />

        <ChatMain
          activeConversationId={activeId}
          messages={activeConversation.messages}
          documents={activeConversation.documents}
          isLoading={!!activeConversation.isLoading}
          chunks={activeChunks}
          onUpdateMessages={updateActiveMessages}
          onSetLoading={setConversationLoading}
          onAddDocument={addDocumentToActive}
          onGenerateTitle={generateConversationTitle}
        />
      </div>
    </div>
  );
}
