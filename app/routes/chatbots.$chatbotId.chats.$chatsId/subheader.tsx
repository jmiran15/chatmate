import { Chat } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/components/ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useFetcher, useParams } from "@remix-run/react";

export default function Subheader({
  chat,
}: {
  chat: Partial<Chat> & { createdAt: string; updatedAt: string };
}) {
  const fetcher = useFetcher();
  const { chatbotId, chatsId } = useParams();
  const starred = fetcher.formData
    ? fetcher.formData.get("star") === "true"
    : chat?.starred;

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
    </div>
  );
}
