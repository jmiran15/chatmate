import { Link, useParams } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ChatsCard({ chat }: { chat: any }) {
  const messages = chat.messages;
  const numberOfUserMessages = messages.filter(
    (message: any) => message.role === "user",
  ).length;

  const { chatsId } = useParams();

  const selected = chatsId === chat.id;

  return (
    <Link
      to={`${chat.id}`}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent "
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
        {numberOfUserMessages > 1 && chat.aiInsights ? (
          <ol className="list-disc px-3">
            {chat.aiInsights.split("\n").map((insight: string) => (
              <li key={insight}>{insight}</li>
            ))}
          </ol>
        ) : (
          "No insights yet"
        )}
      </div>
    </Link>
  );
}
