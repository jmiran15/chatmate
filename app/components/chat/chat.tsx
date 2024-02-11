import { useFetcher } from "@remix-run/react";
import ChatInput from "./input";
import Messages from "./messages";

export default function Chat({
  messages,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
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
    <div className="h-full flex flex-col justify-between">
      <Messages messages={optimisticMessages} loading={isSubmitting} />
      <ChatInput messages={messages} fetcher={fetcher} />
    </div>
  );
}
