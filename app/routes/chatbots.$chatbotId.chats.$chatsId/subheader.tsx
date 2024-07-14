import { Chat } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/components/ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Form, useFetcher, useFetchers, useParams } from "@remix-run/react";
import { Archive } from "lucide-react";

export default function Subheader({
  chat,
}: {
  chat: Partial<Chat> & { createdAt: string; updatedAt: string };
}) {
  const fetcher = useFetcher({ key: `star-chat-${chat.id}-thread` });

  const { chatbotId, chatsId } = useParams();

  const fetchers = useFetchers();
  const starredFetcher = fetchers.find(
    (fetcher) => fetcher.key === `star-chat-${chat.id}-card`,
  );

  const starredFetcherFormDataValue =
    starredFetcher?.formData &&
    starredFetcher.formData.get("chatId") === chat?.id
      ? starredFetcher.formData.get("star") === "true"
      : null;

  let starred = chat.starred;

  if (fetcher.formData) {
    starred = fetcher.formData.get("star") === "true";
  } else if (starredFetcherFormDataValue !== null) {
    starred = starredFetcherFormDataValue;
  }
  return (
    <div className="flex justify-between items-center w-full h-14 border-b bg-muted/40 p-5">
      <div className="flex flex-col items-start justify-center">
        <div className="flex items-center justify-start gap-2">
          <div className="text-md font-semibold">{chat?.name}</div>
          <Button
            onClick={() =>
              fetcher.submit(
                {
                  action: "star",
                  star: !starred,
                  chatId: chatsId!,
                },
                {
                  method: "POST",
                  action: `/chatbots/${chatbotId}/chats`,
                  preventScrollReset: true,
                  unstable_flushSync: true,
                  navigate: false,
                },
              )
            }
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            {starred ? (
              <StarIconSolid className="w-4 h-4" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(chat?.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <Form method="post" className="flex items-center justify-center gap-2">
        <input type="hidden" name="intent" value="archive-chat-thread" />
        <input type="hidden" name="chatId" value={chatsId} />
        <Button variant={"outline"} type="submit">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </Form>
    </div>
  );
}
