import { useParams } from "@remix-run/react";
import { useRef, useState } from "react";
import ChatInput from "~/components/chat/chat-input";
import CodeBlock from "~/components/code-block";

export default function Share() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");

  const { chatbotId } = useParams();
  return (
    <div className="flex flex-col h-full w-full p-8 gap-4">
      <p className="text-muted-foreground">
        To add the chatbot any where on your website, add this iframe and script
        tag to your html code
      </p>
      <CodeBlock
        code={`<script async src="https://chatmate.fly.dev/widget.js" data-chatbotid="${chatbotId}"></script>`}
      />
      <ChatInput
        inputRef={inputRef}
        userInput={userInput}
        setUserInput={setUserInput}
        scrollToBottom={() => {}}
        setAutoScroll={() => {}}
      />
    </div>
  );
}

export const handle = {
  breadcrumb: "share",
};
