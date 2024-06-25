import { Link, useFetcher, useParams, useSearchParams } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../../components/ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

import { cn } from "~/lib/utils";
import { Chat } from "@prisma/client";
import Skeleton from "react-loading-skeleton";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ChatsCard({
  chat,
}: {
  chat: Chat & {
    _count: {
      messages: number;
    };
  };
}) {
  const { chatsId, chatbotId } = useParams();
  // const [starred, setStarred] = useState(chat.starred);
  const [searchParams] = useSearchParams();
  const active = chatsId === chat.id;
  const fetcher = useFetcher();

  const starred = fetcher.formData
    ? fetcher.formData.get("star") === "true"
    : chat.starred;

  return (
    <Link
      prefetch="intent"
      onClick={() => console.log(`clicked "${chat.name}" card`)}
      to={`${chat.id}?${searchParams.toString()}`}
      className={cn(
        "flex flex-col items-start gap-2 text-left text-sm transition-all hover:bg-accent mb-4 p-2 rounded-lg border bg-card text-card-foreground shadow-sm",
        active && "bg-accent",
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center flex-wrap">
          <div className="font-semibold">{chat.name}</div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(chat.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Session id: {chat.sessionId}
        </div>
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
        <p className="text-muted-foreground text-xs">
          {chat._count.messages} messages
        </p>

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
                navigate: false,
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

export function LoadingChatCard() {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 text-left text-sm transition-all mb-4 p-2 rounded-lg border bg-card text-card-foreground shadow-sm",
      )}
    >
      <div className="w-full ">
        <Skeleton width={"70%"} />
      </div>
      <div className="text-xs text-muted-foreground w-full">
        <Skeleton count={3} />
      </div>
    </div>
  );
}
