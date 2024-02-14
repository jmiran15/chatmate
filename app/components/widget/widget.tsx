// in the use effect here, create a "cookie" with a fake user and fake chat, so that we can have something to identify with in the db
// this should take messages just like Chat component
// should be a combo of Chat component and a few other static components for the widget stuff.

import { useEffect, useState } from "react";
import WidgetHeader from "./header";
import Chat from "../chat/chat";
import ActionButton from "./action-button";
import { Card } from "../ui/card";
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

  useEffect(() => {
    requestParentViewportHeight();
  }, [isChatOpen]);

  useEffect(() => {
    function handleViewportHeightMessage(event) {
      if (event.data && event.data.type === "viewportHeight") {
        const parentViewportHeight = event.data.height;
        sendSizeToParent(parentViewportHeight);
      }
    }

    window.addEventListener("message", handleViewportHeightMessage);

    return () => {
      window.removeEventListener("message", handleViewportHeightMessage);
    };
  }, []);

  function requestParentViewportHeight() {
    window.parent.postMessage({ type: "requestViewportHeight" }, "*"); // Replace '*' with the parent domain for security
  }

  function sendSizeToParent(parentViewportHeight) {
    if (typeof parentViewportHeight !== "number") {
      return;
    }

    const size = {
      width: !isChatOpen ? 420 + 8 : 80,
      height: !isChatOpen ? parentViewportHeight : 80,
    };

    window.parent.postMessage(size, "*"); // Use the appropriate domain instead of '*'
  }

  return (
    <div className="fixed bottom-2 right-2 z-50">
      {showIntroMessages ? (
        <IntroMessages
          chatbot={chatbot}
          setVisible={setIsChatOpen}
          setShowIntroMessages={setShowIntroMessages}
        />
      ) : (
        <></>
      )}
      <Card
        style={{
          width: isChatOpen ? 420 : 0,
          height: isChatOpen ? "80vh" : 0,
        }}
        className={cn(
          "absolute bottom-full right-0 mb-4 transition ease-in-out duration-300 flex flex-col justify-between",
          isChatOpen ? "opacity-100" : "opacity-0 invisible",
        )}
      >
        <WidgetHeader chatbot={chatbot} />
        <Chat
          key="widget"
          messages={messages.map((message) => {
            return { role: message.role, content: message.content };
          })}
          chatbot={chatbot}
        />
      </Card>

      <ActionButton
        isOpen={isChatOpen}
        chatbot={chatbot}
        toggleOpen={() => {
          setIsChatOpen((isChatOpen) => !isChatOpen);
          setShowIntroMessages(false);
        }}
      />
    </div>
  );
}
