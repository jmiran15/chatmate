import { ChatBubbleLeftIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { Chat } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import {
  Link,
  useFetcher,
  useFetchers,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "~/lib/utils";
import { Button } from "../../components/ui/button";

export default function ChatsCard({
  chat,
}: {
  chat: SerializeFrom<Chat> & {
    _count: {
      messages: number;
    };
  };
}) {
  const { chatsId, chatbotId } = useParams();
  const [searchParams] = useSearchParams();
  const active = chatsId === chat.id;
  const fetcher = useFetcher({ key: `star-chat-${chat.id}-card` });
  const fetchers = useFetchers();
  const starredFetcher = fetchers.find(
    (fetcher) => fetcher.key === `star-chat-${chat.id}-thread`,
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

  const readFetcher = fetchers.find(
    (fetcher) => fetcher.key === `mark-seen-${chat.id}`,
  );

  const read = readFetcher?.formData
    ? readFetcher.formData.get("intent") === "mark-seen"
    : chat.seen;

  return (
    <Link
      // prefetch="intent" TODO - if this is prefetch, then optimistic starring does work, because we fetch the loader data before the action returns - need some revalidation or conditional prefetching?
      to={`${chat.id}?${searchParams.toString()}`}
      className={cn(
        "flex flex-col items-start gap-2 text-left text-sm transition-all hover:bg-accent mb-4 p-2 rounded-lg border bg-card text-card-foreground shadow-sm",
        active && "bg-accent",
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{chat.name}</div>
            {!read ? (
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            ) : null}
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(chat.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
        {/* <div className="ml-auto text-xs text-muted-foreground">
          Session id: {chat.sessionId}
        </div> */}
      </div>
      <div className="text-xs text-muted-foreground">
        {chat.aiInsights ? (
          <ol className="list-disc px-3">
            {chat.aiInsights.split("\n").map((insight: string) => (
              <li key={insight}>{insight}</li>
            ))}
          </ol>
        ) : (
          "No insights yet"
        )}
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center text-muted-foreground text-xs">
          <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
          {chat._count.messages}
        </div>

        <Button
          onClick={(e) => {
            fetcher.submit(
              {
                action: "star",
                star: !starred,
                chatId: chat.id,
              },
              {
                method: "POST",
                action: `/chatbots/${chatbotId}/chats`,
                preventScrollReset: true,
                unstable_flushSync: true,
              },
            );
            e.preventDefault();
            e.stopPropagation();
          }}
          type="submit"
          variant="ghost"
          size="icon"
        >
          {starred ? (
            <StarIconSolid className="w-4 h-4" />
          ) : (
            <StarIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Link>
  );
}
