import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { colors } from "./preview";
import { Chatbot } from "@prisma/client";

export default function PromptInput({ chatbot }: { chatbot: Chatbot }) {
  return (
    <form className="relative w-full flex-col min-h-[56px] max-h-[200px] input-border-top overflow-hidden bg-white">
      <div className="flex items-start w-full px-[29px] py-[18px]">
        <textarea
          required={true}
          className="overflow-auto overflow-x-hidden resize-none border-none box-border w-full h-full text-[14px] leading-snug whitespace-pre-wrap	break-words	max-h-[200px] cursor-text focus:outline-none overscroll-none disabled:bg-white"
          placeholder={"Send a message"}
        />
        <button
          type="submit"
          className="inline-flex justify-center rounded-2xl cursor-pointer group ml-4"
        >
          <PaperAirplaneIcon
            className={`w-[16px] h-[16px] text-${colors[chatbot.themeColor]}`}
          />

          <span className="sr-only">Send message</span>
        </button>
      </div>
    </form>
  );
}
