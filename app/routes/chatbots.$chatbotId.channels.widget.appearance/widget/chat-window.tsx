import { useMobileScreen } from "~/utils/mobile";
import ChatContainer from "./chat-container";
import ChatWindowHeader from "./chat-header";
import { Chatbot } from "@prisma/client";

export default function ChatWindow({
  chatbot,
  closeChat,
}: {
  chatbot: Chatbot;
  closeChat: () => void;
}) {
  const isMobile = useMobileScreen();
  const desktopStyle =
    "bg-red-100 flex flex-col flex-1 mb-[16px] z-9999 min-h-[80px] w-[400px] max-h-[704px] opacity-100 overflow-hidden chat-window-custom";
  const mobileStyle =
    "flex flex-col flex-1 fixed bottom-0 right-0 z-9999 opacity-100 overflow-hidden h-dvh w-dvw";
  return (
    <div
      className={isMobile ? mobileStyle : desktopStyle}
      style={{
        borderRadius: isMobile ? "0rem" : chatbot.containerRadius + "rem",
      }}
    >
      <ChatWindowHeader chatbot={chatbot} closeChat={closeChat} />
      <ChatContainer chatbot={chatbot} />
    </div>
  );
}
