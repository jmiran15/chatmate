// in the use effect here, create a "cookie" with a fake user and fake chat, so that we can have something to identify with in the db
// this should take messages just like Chat component
// should be a combo of Chat component and a few other static components for the widget stuff.

import { useEffect, useState } from "react";
import WidgetHeader from "./header";
import Chat from "../chat/chat";
import ActionButton from "./action-button";
import { Card, CardContent } from "../ui/card";
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
  const [visible, setVisible] = useState(false);
  const [showIntroMessages, setShowIntroMessages] = useState(true);

  // const [chatbot, setChatbot] = useState({});

  // useEffect(() => {
  //   // load the chatbot stuff
  //   fetch(`/api/chatbot/${chatbotId}`)
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setChatbot(data);
  //     });
  // }, [chatbotId]);

  // console.log(chatbot);

  return (
    <div className="fixed bottom-2 right-2 p-4 z-50">
      {showIntroMessages ? (
        <IntroMessages
          chatbot={chatbot}
          setVisible={setVisible}
          setShowIntroMessages={setShowIntroMessages}
        />
      ) : (
        <></>
      )}

      <Card
        className={cn(
          "absolute bottom-full right-4 mb-2 transition ease-in-out duration-300 flex flex-col justify-between",
          " h-[80vh]",
          "w-[420px]",
          visible ? "opacity-100" : "opacity-0 invisible",
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
        chatbot={chatbot}
        toggle={() => {
          setVisible(!visible);
          setShowIntroMessages(false);
        }}
        visible={visible}
      />
    </div>
  );
}
