import HistoricalMessage from "./historical-message";
import { Chatbot } from "@prisma/client";

export default function ChatHistory({ chatbot }: { chatbot: Chatbot }) {
  const history = chatbot.introMessages;
  const followUps = chatbot.starterQuestions;

  return (
    <div
      className="flex flex-col flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-[4px] px-[24px] pt-[24px] bg-white"
      id="chat-history"
    >
      {history.map((message, index) => {
        return <HistoricalMessage key={index} message={message} />;
      })}
      {followUps.length > 0 ? (
        followUps.map((followUp, i) => {
          return (
            <div
              key={i}
              className="mb-[16px] border border-input bg-white hover:bg-[#f2f2f2] rounded-[10px] relative px-3 py-2 w-auto max-w-[75%] h-fit inline-block ml-auto"
            >
              <button className="text-left whitespace-normal break-words flex flex-col gap-y-1 text-black text-sm select-text">
                {followUp}
              </button>
            </div>
          );
        })
      ) : (
        <></>
      )}
    </div>
  );
}
