import { Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export const useMarkMessageSeen = (message: SerializeFrom<Message>) => {
  const fetcher = useFetcher({ key: `mark-message-seen-${message.id}` });

  const markMessageSeen = () =>
    fetcher.submit(
      {
        intent: "mark-user-messages-seen",
        messageId: message.id,
      },
      { method: "post", preventScrollReset: true },
    );

  const isMessageSeen = fetcher.formData ? true : message.seenByAgent;

  return { markMessageSeen, isMessageSeen };
};
