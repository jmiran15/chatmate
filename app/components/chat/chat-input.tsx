import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
// import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useFetcher } from "@remix-run/react";
import { Chatbot } from "@prisma/client";
import tinycolor from "tinycolor2";
// import { useDebouncedCallback } from "use-debounce";
// import { ChatControllerPool } from "../../client/controller";
// import Locale from "../../locales";
// import { callSession } from "../../store";
// import { autoGrowTextArea } from "~/utils/autogrow";
// import { useMobileScreen } from "~/utils/mobile.client";

export default function ChatInput({
  inputRef,
  scrollToBottom,
  chatbot,
  messages,
  fetcher,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  scrollToBottom: () => void;
  chatbot: Chatbot;
  messages: { role: "user" | "assistant"; content: string }[];
  fetcher: ReturnType<typeof useFetcher>;
}) {
  // const { toast } = useToast();
  const [inputRows, setInputRows] = useState(2);

  const formRef = useRef<HTMLFormElement>();
  const isSubmitting = fetcher.state === "submitting";
  const [isHovered, setIsHovered] = useState(false);

  // const showError = (errMsg: string) => {
  //   toast({
  //     title: errMsg,
  //     variant: "destructive",
  //   });
  // };

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
    <fetcher.Form
      method="post"
      ref={formRef}
      className="flex flex-1 items-end relative"
    >
      <input type="hidden" name="messages" value={JSON.stringify(messages)} />
      <Textarea
        className={cn(
          "ring-inset focus-visible:ring-offset-0 pr-28 md:pr-40 min-h-[56px]",
        )}
        ref={inputRef}
        placeholder={"Enter to send, Shift + Enter to wrap"}
        onFocus={scrollToBottom}
        onClick={scrollToBottom}
        rows={inputRows}
        name="message"
      />

      <div className="my-2 flex items-center gap-2.5 absolute right-[15px]">
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: isHovered ? hoverColor : chatbot.color,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </fetcher.Form>
  );
}
