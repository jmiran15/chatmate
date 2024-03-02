import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
// import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useFetcher } from "@remix-run/react";
import { Chatbot } from "@prisma/client";
import { useMobileScreen } from "~/utils/mobile";
import { useDebouncedCallback } from "use-debounce";
import { autoGrowTextArea } from "~/utils/autogrow";
import { useSubmitHandler } from "~/hooks/useSubmit";

export default function ChatInput({
  userInput,
  setUserInput,
  inputRef,
  scrollToBottom,
  chatbot,
  messages,
  fetcher,
  setAutoScroll,
}: {
  userInput: string;
  setUserInput: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  scrollToBottom: () => void;
  chatbot: Chatbot;
  messages: { role: "user" | "assistant"; content: string }[];
  fetcher: ReturnType<typeof useFetcher>;
  setAutoScroll: (autoScroll: boolean) => void;
}) {
  // const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>();
  const isSubmitting = fetcher.state === "submitting";
  const { shouldSubmit } = useSubmitHandler();

  const isMobileScreen = useMobileScreen();

  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(1 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // const showError = (errMsg: string) => {
  //   toast({
  //     title: errMsg,
  //     variant: "destructive",
  //   });
  // };

  useEffect(() => {
    if (isSubmitting) {
      formRef.current?.reset();
      setUserInput("");
      setAutoScroll(true);
    } else {
      inputRef.current?.focus();
    }
  }, [isSubmitting, chatbot.color]);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (shouldSubmit(e)) {
      if (!isSubmitting) {
        const formData = new FormData(formRef.current);

        fetcher.submit(formData, {
          method: "post",
        });
      }
      e.preventDefault();
    }
  };

  return (
    <fetcher.Form
      method="post"
      ref={formRef}
      className="flex flex-1 items-end relative"
    >
      <input type="hidden" name="chatbot" value={JSON.stringify(chatbot)} />
      <input type="hidden" name="messages" value={JSON.stringify(messages)} />
      <Textarea
        className={cn(
          "ring-inset focus-visible:ring-offset-0 pr-28 md:pr-40 min-h-[56px]",
        )}
        ref={inputRef}
        placeholder={
          isMobileScreen
            ? "Enter to send"
            : "Enter to send, Shift + Enter to wrap"
        }
        onFocus={scrollToBottom}
        onClick={scrollToBottom}
        rows={inputRows}
        name="message"
        onKeyDown={onInputKeyDown}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
      />

      <div className="my-2 flex items-center gap-2.5 absolute right-[15px]">
        {isMobileScreen ? (
          <Button type="submit" size="icon" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        )}
      </div>
    </fetcher.Form>
  );
}
