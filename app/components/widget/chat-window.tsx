import ChatContainer from "./chat-container";
import ChatWindowHeader from "./chat-header";
import { Chatbot } from "@prisma/client";

export default function ChatWindow({ chatbot }: { chatbot: Chatbot }) {
  const desktopStyle =
    "bg-red-100 flex flex-col flex-1 mb-[16px] z-9999 min-h-[80px] w-[400px] max-h-[704px] rounded-[16px] opacity-100 overflow-hidden chat-window-custom";

  return (
    <div className={desktopStyle}>
      <ChatWindowHeader chatbot={chatbot} />
      <ChatContainer chatbot={chatbot} />
    </div>
  );
}
