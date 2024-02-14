// in the use effect here, create a "cookie" with a fake user and fake chat, so that we can have something to identify with in the db
// this should take messages just like Chat component
// should be a combo of Chat component and a few other static components for the widget stuff.

import { useEffect, useState } from "react";
import WidgetHeader from "./header";
import Chat from "../chat/chat";
import ActionButton from "./action-button";
import { cn } from "~/lib/utils";
import IntroMessages from "./intro-messages";

export default function Widget({
  messages,
  chatbot,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  chatbot: string;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showIntroMessages, setShowIntroMessages] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // request viewport size from parent
    window.parent.postMessage({ type: "requestViewportSize" }, "*");

    function handleViewportResizeMessage(event) {
      if (event.data && event.data.type === "sizeChange") {
        const { width, height } = event.data;
        setViewportSize({ width, height });
      }
    }

    window.addEventListener("message", handleViewportResizeMessage);

    return () => {
      window.removeEventListener("message", handleViewportResizeMessage);
    };
  }, []);

  const isMobile = viewportSize.width < 640; // sm breakpoint per tailwind

  useEffect(() => {
    sendSizeToParent();
  }, [isMobile, isChatOpen]);

  function sendSizeToParent() {
    const size = {
      width: isChatOpen ? (isMobile ? viewportSize.width : 420 + 8) : 80,
      height: isChatOpen
        ? isMobile
          ? viewportSize.height
          : viewportSize.height * 0.8 + 64 + 32
        : 80,

      bottom: isChatOpen ? (isMobile ? 0 : 8) : 8,
      right: isChatOpen ? (isMobile ? 0 : 8) : 8,
    };

    window.parent.postMessage(size, "*"); // Use the appropriate domain instead of '*'
  }

  return (
    <div
      className={cn(
        "fixed  z-50",
        isMobile ? "bottom-0 right-0" : "bottom-2 right-2",
      )}
    >
      {showIntroMessages ? (
        <IntroMessages
          chatbot={chatbot}
          setVisible={setIsChatOpen}
          setShowIntroMessages={setShowIntroMessages}
          viewportSize={viewportSize}
        />
      ) : (
        <></>
      )}
      <div
        style={{
          width: isChatOpen ? (isMobile ? viewportSize.width : 420) : 0,
          height: isChatOpen
            ? isMobile
              ? viewportSize.height
              : viewportSize.height * 0.8
            : 0,
        }}
        className={cn(
          "transition ease-in-out duration-300 flex flex-col justify-between",
          isChatOpen ? "opacity-100" : "opacity-0 invisible",
          isMobile
            ? "bg-card absolute bottom-0 right-0"
            : "rounded-lg border bg-card text-card-foreground shadow-sm absolute bottom-full right-0 mb-4",
        )}
      >
        <WidgetHeader
          chatbot={chatbot}
          close={() => {
            setIsChatOpen(false);
          }}
        />
        <Chat
          key="widget"
          messages={messages.map((message) => {
            return { role: message.role, content: message.content };
          })}
          chatbot={chatbot}
        />
      </div>

      {isMobile && isChatOpen ? (
        <></>
      ) : (
        <ActionButton
          isOpen={isChatOpen}
          chatbot={chatbot}
          toggleOpen={() => {
            setIsChatOpen((isChatOpen) => !isChatOpen);
            setShowIntroMessages(false);
          }}
        />
      )}
    </div>
  );
}
