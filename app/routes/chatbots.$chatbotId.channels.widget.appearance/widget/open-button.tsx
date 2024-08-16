import {
  ChatBubbleLeftEllipsisIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Chatbot } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useMobileScreen } from "~/utils/mobile";
import { colors } from "./preview";

const CHAT_ICONS = {
  plus: PlusIcon,
  chevron: ChevronDoubleUpIcon,
  chat: ChatBubbleLeftEllipsisIcon,
} as const;

type ChatIconType = keyof typeof CHAT_ICONS;

type ThemeColor = keyof typeof colors;

export default function OpenButton({
  chatbot,
  isChatOpen,
  setIsChatOpen,
  sidebarWidth,
  customizerWidth,
  isLeftAligned,
}: {
  chatbot: Chatbot & { openIcon: ChatIconType; themeColor: ThemeColor };
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number;
  customizerWidth: number;
  isLeftAligned: boolean;
}) {
  const ChatIcon = CHAT_ICONS[chatbot.openIcon];

  const buttonClasses = `z-[9999] flex items-center justify-center p-0 rounded-full bg-${
    colors[chatbot.themeColor]
  } text-white text-2xl border-none shadow-lg focus:outline-none cursor-pointer box-content button-hover-effect shadow-custom`;

  const iconClasses = "text-white w-[24px] h-[24px]";

  const isMobile = useMobileScreen();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isChatOpen) {
      setShouldAnimate(true);
    }
  }, [isChatOpen]);

  return (
    <motion.div
      className={`${buttonClasses} ${
        chatbot.openButtonText && !isChatOpen
          ? "px-3 h-[48px] w-auto"
          : "w-[48px] h-[48px]"
      } relative`}
      aria-label="Toggle Menu"
      onClick={() => setIsChatOpen((_isOpen) => !_isOpen)}
      whileHover={{ scale: 1.03, boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{
        overflow: "hidden",
        position: "absolute",
        bottom: "20px",
        [isLeftAligned ? "left" : "right"]: isLeftAligned
          ? isMobile
            ? "20px"
            : `${sidebarWidth + customizerWidth + 20}px`
          : "20px",
      }}
    >
      <div className="flex items-center">
        <AnimatePresence mode="wait">
          {isChatOpen ? (
            <motion.div
              key="close"
              initial={shouldAnimate ? { rotate: -90 } : { rotate: 0 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDownIcon className={iconClasses} />
            </motion.div>
          ) : (
            <ChatIcon className={iconClasses} />
          )}
        </AnimatePresence>
        {chatbot.openButtonText && !isChatOpen && (
          <span className="mx-2 text-sm font-semibold whitespace-nowrap overflow-hidden">
            {chatbot.openButtonText}
          </span>
        )}
      </div>
    </motion.div>
  );
}
