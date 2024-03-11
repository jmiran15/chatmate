import { Chatbot } from "@prisma/client";
import OpenButton from "./open-button";
import ChatWindow from "./chat-window";
import "./styles.css";
import { useState } from "react";

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

export default function Preview({ chatbot }: { chatbot: Chatbot }) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  if (!chatbot) return null;

  return (
    <>
      {isChatOpen && <ChatWindow chatbot={chatbot} />}
      <OpenButton
        chatbot={chatbot}
        setIsChatOpen={setIsChatOpen}
        isChatOpen={isChatOpen}
      />
    </>
  );
}
