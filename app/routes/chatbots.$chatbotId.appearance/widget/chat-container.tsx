import { Chatbot } from "@prisma/client";
import ChatHistory from "./chat-history";
import PromptInput from "./prompt-input";

export default function ChatContainer({ chatbot }: { chatbot: Chatbot }) {
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-w-full">
      <ChatHistory chatbot={chatbot} />
      <PromptInput chatbot={chatbot} />
    </div>
  );
}
