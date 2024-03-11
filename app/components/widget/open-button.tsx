import {
  ChatBubbleLeftEllipsisIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { colors } from "./preview";
import { Chatbot } from "@prisma/client";

const CHAT_ICONS = {
  plus: PlusIcon,
  chevron: ChevronDoubleUpIcon,
  chat: ChatBubbleLeftEllipsisIcon,
};

export default function OpenButton({
  chatbot,
  isChatOpen,
  setIsChatOpen,
}: {
  chatbot: Chatbot;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const ChatIcon = CHAT_ICONS[chatbot.openIcon];

  return (
    <div
      className={`z-9999 flex items-center justify-center p-0 rounded-full bg-${
        colors[chatbot?.themeColor]
      } text-white text-2xl max-w-[48px] w-[48px] max-h-[48px] h-[48px] border-none shadow-lg focus:outline-none cursor-pointer box-content button-hover-effect shadow-custom transition-custom`}
      aria-label="Toggle Menu"
      onClick={() => setIsChatOpen((_isOpen) => !_isOpen)}
    >
      {isChatOpen ? (
        <ChevronDownIcon className="text-white w-[24px] h-[24px]" />
      ) : (
        <ChatIcon className="text-white w-[24px] h-[24px]" />
      )}
    </div>
  );
}
