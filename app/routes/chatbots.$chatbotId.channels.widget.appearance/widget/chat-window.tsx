import { Chatbot } from "@prisma/client";
import { useMobileScreen } from "~/utils/mobile";
import ChatContainer from "./chat-container";
import ChatWindowHeader from "./chat-header";

export default function ChatWindow({
  chatbot,
  closeChat,
  isLeftAligned,
  sidebarWidth,
  customizerWidth,
}: {
  chatbot: Chatbot;
  closeChat: () => void;
  isLeftAligned: boolean;
  sidebarWidth: number;
  customizerWidth: number;
}) {
  const isMobile = useMobileScreen();

  const desktopStyle = `
    z-[999] flex flex-col flex-1 bottom-[84px] 
    min-h-[80px] w-[400px] 
    max-h-[704px] opacity-100 overflow-hidden chat-window-custom
    absolute bottom-[80px]`;

  const mobileStyle =
    "z-[999] flex flex-col flex-1 fixed bottom-0 right-0 opacity-100 overflow-hidden h-dvh w-dvw";

  return (
    <div
      className={isMobile ? mobileStyle : desktopStyle}
      style={{
        borderRadius: isMobile ? "0rem" : chatbot.containerRadius + "rem",
        ...(isMobile
          ? {}
          : {
              [isLeftAligned ? "left" : "right"]: isLeftAligned
                ? isMobile
                  ? "20px"
                  : `${sidebarWidth + customizerWidth + 20}px`
                : "20px",
            }),
      }}
    >
      <ChatWindowHeader chatbot={chatbot} closeChat={closeChat} />
      <ChatContainer chatbot={chatbot} />
    </div>
  );
}
