import React from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { colors } from "./preview";
import { Chatbot } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

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

  const buttonClasses = `z-9999 flex items-center justify-center p-0 rounded-full bg-${
    colors[chatbot?.themeColor]
  } text-white text-2xl border-none shadow-lg focus:outline-none cursor-pointer box-content button-hover-effect shadow-custom`;

  const iconClasses = "text-white w-[24px] h-[24px]";

  return (
    <motion.div
      className={`${buttonClasses} ${
        chatbot.openButtonText && !isChatOpen
          ? "pr-4 pl-3 py-2"
          : "w-[48px] h-[48px]"
      }`}
      aria-label="Toggle Menu"
      onClick={() => setIsChatOpen((_isOpen) => !_isOpen)}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div className="flex items-center">
        {isChatOpen ? (
          <ChevronDownIcon className={iconClasses} />
        ) : (
          <ChatIcon className={iconClasses} />
        )}
        <AnimatePresence>
          {chatbot.openButtonText && !isChatOpen ? (
            <motion.span
              className="ml-2 text-sm font-semibold whitespace-nowrap overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {chatbot.openButtonText}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
