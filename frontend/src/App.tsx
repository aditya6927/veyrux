import { useChat } from "@/hooks/useChat";
import Header from "@/components/layout/Header";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
// import ChatWindow from "!/components/chat/ChatWindow";

function App() {
  const { state, sendFile } = useChat();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />
      <ChatWindow messages={state.messages} isLoading={state.isLoading} />
      <ChatInput onSendFile={sendFile} isLoading={state.isLoading} />
      {state.error && (
        <div className="px-4 pb-2 text-sm text-destructive text-center">
          {state.error}
        </div>
      )}
    </div>
  );
}
export default App;
