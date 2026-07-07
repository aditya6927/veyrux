import { useChat } from "@/hooks/useChat";
import Header from "@/components/layout/Header";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

export default function App() {
  const { state, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto max-w-3xl h-full flex flex-col">
          <ChatWindow messages={state.messages} isLoading={state.isLoading} />
        </div>
      </div>

      <div className="w-full pb-4">
        {/* CRITICAL FIXED PROP BINDING HERE */}
        <ChatInput onSubmit={sendMessage} isLoading={state.isLoading} />
        {state.error && (
          <div className="max-w-3xl mx-auto px-4 mt-2 text-xs text-destructive text-center">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
