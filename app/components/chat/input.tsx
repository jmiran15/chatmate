import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { CardFooter } from "../ui/card";

export default function ChatInput({
  messages,
  fetcher,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  fetcher: ReturnType<typeof useFetcher>;
}) {
  const formRef = useRef<HTMLFormElement>();
  const inputRef = useRef<HTMLInputElement>();
  const isSubmitting = fetcher.state === "submitting";

  useEffect(() => {
    if (isSubmitting) {
      formRef.current?.reset();
    } else {
      inputRef.current?.focus();
    }
  }, [isSubmitting]);

  return (
    <CardFooter>
      <fetcher.Form
        method="post"
        ref={formRef}
        className="flex w-full items-center space-x-2"
      >
        {/* this is taking up space even though its hidden, make it not take up space */}
        <input type="hidden" name="messages" value={JSON.stringify(messages)} />
        <Input
          ref={inputRef}
          placeholder="Type your message..."
          className="flex-1"
          autoComplete="off"
          type="text"
          name="message"
        />
        <Button type="submit" size="icon" disabled={isSubmitting}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </fetcher.Form>
    </CardFooter>
  );
}
