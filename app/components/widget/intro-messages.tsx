import { Chatbot } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";

export default function IntroMessages({
  chatbot,
  setVisible,
  setShowIntroMessages,
}: {
  chatbot: Chatbot;
  setVisible: (visible: boolean) => void;
  setShowIntroMessages: (showIntroMessages: boolean) => void;
}) {
  const [introOpacity, setIntroOpacity] = useState("opacity-0");
  const introRef = useRef(null); // Create a ref for the div

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroOpacity("opacity-100");

      console.log("introRef", introRef);

      if (introRef.current) {
        const { width, height } = introRef.current.getBoundingClientRect();
        const size = { width: width + 8, height: height + 64 + 32 + 8 }; // 32 = 32rem

        console.log("size", size);
        window.parent.postMessage(size, "*");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [introRef]);

  return (
    <div
      ref={introRef}
      className={cn(
        "flex flex-col items-end gap-2 absolute bottom-[6rem] right-0 cursor-pointer",
      )}
      onClick={() => {
        setVisible(true);
        setShowIntroMessages(false);
      }}
    >
      {chatbot.introMessages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm text-sm text-gray-600 truncate overflow-hidden p-4 max-w-md transition-opacity duration-700 ease-out",
            introOpacity,
          )}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
