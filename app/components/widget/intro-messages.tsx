import { Chatbot } from "@prisma/client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroOpacity("opacity-100");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-2 absolute bottom-[5rem] right-4 mb-2 cursor-pointer",
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
