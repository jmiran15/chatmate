import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { CardFooter } from "../ui/card";
import { Chatbot } from "@prisma/client";
import tinycolor from "tinycolor2";
import ExampleQueries from "./example-queries";

export default function ChatInput({
  messages,
  fetcher,
  chatbot,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  fetcher: ReturnType<typeof useFetcher>;
  chatbot: Chatbot;
}) {
  const formRef = useRef<HTMLFormElement>();
  const inputRef = useRef<HTMLInputElement>();
  const isSubmitting = fetcher.state === "submitting";
  const [isHovered, setIsHovered] = useState(false);

  const hslColor = tinycolor(chatbot.color).toHsl();
  hslColor.l -= 0.1;
  const hoverColor = tinycolor(hslColor).toHexString();

  useEffect(() => {
    if (isSubmitting) {
      formRef.current?.reset();
    } else {
      inputRef.current?.focus();
    }
  }, [isSubmitting, chatbot.color]);

  return (
    <CardFooter>
      <fetcher.Form
        method="post"
        ref={formRef}
        className="flex flex-col w-full gap-2"
      >
        <input type="hidden" name="messages" value={JSON.stringify(messages)} />
        <ExampleQueries
          chatbot={chatbot}
          fetcher={fetcher}
          inputRef={inputRef}
          formRef={formRef}
        />
        <div className="flex flex-row items-center w-full space-x-2">
          <input
            ref={inputRef}
            placeholder="Type your message..."
            className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            autoComplete="off"
            type="text"
            name="message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting}
            style={{
              backgroundColor: isHovered ? hoverColor : chatbot.color,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Send className="h-4 w-4" />
            {/* <span className="sr-only">Send</span> */}
          </Button>
        </div>
      </fetcher.Form>
    </CardFooter>
  );
}
