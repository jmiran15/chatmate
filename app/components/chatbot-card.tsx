import { Chatbot } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";

export default function ChatbotCard({ chatbot }: { chatbot: Chatbot }) {
  return (
    <Link
      to={`${chatbot.id}/chats`}
      className="flex w-full items-center justify-between rounded-lg border p-6 text-left transition-all hover:bg-accent"
    >
      <div className="font-semibold">{chatbot.name}</div>
      <div className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(chatbot.createdAt), {
          addSuffix: true,
        })}{" "}
      </div>
    </Link>
  );
}
