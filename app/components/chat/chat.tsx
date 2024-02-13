import { useFetcher } from "@remix-run/react";
import ChatInput from "./input";
import Messages from "./messages";
import { Chatbot } from "@prisma/client";

export default function Chat({
  messages,
  chatbot,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  chatbot: Chatbot;
}) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";
  console.log("isSubmitting", isSubmitting);

  const optimisticMessages = isSubmitting
    ? [
        ...messages,
        {
          role: "user" as "user" | "assistant",
          content: fetcher.formData?.get("message") as string,
        },
      ]
    : messages;

  return (
    <>
      <Messages
        messages={optimisticMessages}
        loading={isSubmitting}
        chatbot={chatbot}
      />
      <ChatInput messages={messages} fetcher={fetcher} chatbot={chatbot} />
    </>
  );
}
