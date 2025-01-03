import { BoltIcon, EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
// import { useMobileScreen } from "@/utils/mobile";
import { Chatbot } from "@prisma/client";
import { useMobileScreen } from "~/utils/mobile";
import { colors } from "./preview";

export default function ChatWindowHeader({
  chatbot,
  closeChat,
}: {
  chatbot: Chatbot;
  closeChat: () => void;
}) {
  const [showingOptions, setShowOptions] = useState(false);
  const isMobile = useMobileScreen();

  return (
    <nav
      className={`flex flex-col p-[8px] chat-header-bottom-border bg-${
        colors[chatbot.themeColor as keyof typeof colors]
      }`}
    >
      <div className="flex flex-row flex-1 items-center justify-between gap-[2px] min-h-[48px] text-[18px]">
        <button className="flex flex-row gap-[12px] max-h-[48px] h-[48px] min-w-[48px] bg-transparent border-none box-border rounded-[10px] w-full p-[6px] items-center chat-header-button chat-header-btn">
          {chatbot.croppedLogoFilepath ? (
            <img
              className="rounded-full max-h-[32px] h-[32px] w-[32px] max-w-[32px] chat-header-image"
              src={chatbot.croppedLogoFilepath}
              alt={chatbot.publicName}
            />
          ) : null}
          <div className="flex flex-col items-start">
            <h1 className="text-[16px] font-[600] text-white">
              {chatbot.publicName}
            </h1>
            <div
              className={`
                text-[14px] text-white/80 overflow-hidden transition-all duration-300 ease-in-out
                ${
                  chatbot.subheader
                    ? "max-h-[20px] opacity-100"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              {chatbot.subheader}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowOptions(!showingOptions)}
          className="min-w-[48px] max-h-[48px] h-[48px] w-[48px] bg-transparent border-none box-border rounded-[10px] flex items-center justify-center px-[12px] text-white settings-button chat-header-btn"
        >
          <EllipsisVerticalIcon className="text-white w-auto min-h-[24px] h-[24px]" />
        </button>
        {isMobile && (
          <button
            type="button"
            onClick={closeChat}
            className="min-w-[48px] max-h-[48px] h-[48px] w-[48px] bg-transparent border-none box-border rounded-[10px] flex items-center justify-center px-[12px] text-white settings-button chat-header-btn"
          >
            <XMarkIcon className="text-white w-auto min-h-[24px] h-[24px]" />
          </button>
        )}
      </div>
      {showingOptions && <OptionsMenu />}
    </nav>
  );
}

function OptionsMenu() {
  return (
    <div className="absolute z-10 bg-white flex flex-col gap-y-1 rounded-lg shadow-lg border border-gray-300 top-[23px] right-[20px] max-w-[150px]">
      <button className="flex items-center gap-x-1 hover:bg-gray-100 text-sm text-gray-700 p-2 rounded-lg">
        <BoltIcon className="w-[16px] h-[16px]" />
        <p>Reset Chat</p>
      </button>
      {/* <ContactSupport email={"jmiran15@jhu.edu"} /> */}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ContactSupport({ email = null }) {
  if (!email) return null;

  const subject = `Inquiry from ${window.location.origin}`;
  return (
    <a
      href={`mailto:${email}?Subject=${encodeURIComponent(subject)}`}
      className="flex items-center gap-x-1 hover:bg-gray-100 text-sm text-gray-700 p-2 rounded-lg"
    >
      <EnvelopeIcon className="w-[16px] h-[16px]" />
      <p>Email support</p>
    </a>
  );
}
