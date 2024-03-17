import { Form, Link, useParams } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ChatsCard({ chat }: { chat: any }) {
  // const messages = chat.messages;
  // const numberOfUserMessages = messages.filter(
  //   (message: any) => message.role === "user",
  // ).length;

  const { chatsId, chatbotId } = useParams();

  const selected = chatsId === chat.id;
  const [starred, setStarred] = useState(chat.starred);

  return (
    <Link
      to={`${chat.id}`}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
      style={{
        backgroundColor: selected ? "#f5f5f4" : "#fff",
      }}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold">{chat.name}</div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(chat.createdAt), {
              addSuffix: true,
            })}
          </div>
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
        <Form
          method="POST"
          action={`/chatbots/${chatbotId}/chats`}
          className="self-end"
          onSubmit={() => setStarred((starred) => !starred)} // optimistic UI? might not be in sync with backend
        >
          <input type="hidden" name="action" value="star" />
          <input type="hidden" name="star" value={!chat.starred} />
          <input type="hidden" name="chatId" value={chat.id} />
          <Button
            onClick={(e) => e.stopPropagation()}
            type="submit"
            variant={"outline"}
            className="h-[36px] w-[36px] p-0 m-0  items-center justify-center flex"
          >
            {starred ? (
              <StarIconSolid className="w-[18px] h-[18px]" />
            ) : (
              <StarIcon className="w-[18px] h-[18px]" />
            )}
          </Button>
        </Form>
      </div>
    </Link>
  );
}
