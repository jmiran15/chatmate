import HistoricalMessage from "./historical-message";
import { Chatbot } from "@prisma/client";

export default function ChatHistory({ chatbot }: { chatbot: Chatbot }) {
  // get the starter messages
  const history = chatbot.introMessages;

  return (
    <div
      className="flex flex-col flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-[4px] px-[24px] pt-[24px] bg-white"
      id="chat-history"
    >
      {history.map((message, index) => {
        return <HistoricalMessage key={index} message={message} />;
      })}
    </div>
  );
}
