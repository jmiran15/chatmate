import { Chatbot, WidgetPosition } from "@prisma/client";
import { useEffect, useState } from "react";
import { useMobileScreen } from "~/utils/mobile";
import ChatWindow from "./chat-window";
import OpenButton from "./open-button";
import "./styles.css";

export const colors = {
  zinc: "zinc-900",
  red: "red-600",
  orange: "orange-500",
  amber: "amber-400",
  yellow: "yellow-300",
  lime: "lime-300",
  green: "green-600",
  emerald: "emerald-600",
  teal: "teal-600",
  cyan: "cyan-300",
  sky: "sky-500",
  blue: "blue-600",
  indigo: "indigo-500",
  violet: "violet-500",
  purple: "purple-500",
  fuchsia: "fuchsia-500",
  pink: "pink-500",
  rose: "rose-500",
};

export default function Preview({
  chatbot,
  sidebarWidth,
  customizerWidth,
}: {
  chatbot: Chatbot;
  sidebarWidth: number;
  customizerWidth: number;
}) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const isMobile = useMobileScreen();

  useEffect(() => {
    if (isMobile) {
      setIsChatOpen(false);
    } else {
      setIsChatOpen(true);
    }
  }, [isMobile]);

  if (!chatbot) return null;

  console;

  const isLeftAligned = chatbot.widgetPosition === WidgetPosition.BOTTOM_LEFT;

  return (
    <>
      {isChatOpen && (
        <ChatWindow
          chatbot={chatbot}
          closeChat={() => setIsChatOpen(false)}
          sidebarWidth={sidebarWidth}
          customizerWidth={customizerWidth}
          isLeftAligned={isLeftAligned}
        />
      )}
      {isMobile && isChatOpen ? null : (
        <OpenButton
          chatbot={{
            ...chatbot,
            openIcon: chatbot.openIcon as "plus" | "chevron" | "chat",
            themeColor: chatbot.themeColor as keyof typeof colors,
          }}
          setIsChatOpen={setIsChatOpen}
          isChatOpen={isChatOpen}
          sidebarWidth={sidebarWidth}
          customizerWidth={customizerWidth}
          isLeftAligned={isLeftAligned}
        />
      )}
    </>
  );
}
