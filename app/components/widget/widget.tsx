// in the use effect here, create a "cookie" with a fake user and fake chat, so that we can have something to identify with in the db
// this should take messages just like Chat component
// should be a combo of Chat component and a few other static components for the widget stuff.

import { useState } from "react";
import WidgetHeader from "./header";
import Chat from "../chat/chat";
import ActionButton from "./action-button";

export default function Widget({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="fixed bottom-2 right-2 p-4 z-50">
      <div
        className={`chat-interface flex flex-col justify-between absolute h-[90vh] md:h-[80vh] w-[95vw] md:w-[28vw] bg-white rounded-2xl shadow-sm overflow-hidden bottom-full right-4 mb-2
                  transition ease-in-out duration-300 ${
                    visible ? "opacity-100" : "opacity-0 invisible"
                  }`}
      >
        {/* Chat Header */}
        <div>
          <WidgetHeader close={() => setVisible(false)} />
          <Chat
            key="widget"
            messages={messages.map((message) => {
              return { role: message.role, content: message.content };
            })}
          />
        </div>
      </div>

      <ActionButton
        toggle={() => setVisible((visible) => !visible)}
        visible={visible}
      />
    </div>
  );
}
