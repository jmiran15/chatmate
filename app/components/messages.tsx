import { Message, Role } from "@prisma/client";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "~/lib/utils";

export default function Messages({ messages }: { messages: Message[] }) {
  return (
    <ScrollArea className="flex-1 overflow-y-auto py-4 px-16">
      {messages.length === 0 ? (
        <p className="">No messages yet</p>
      ) : (
        <div className="flex flex-col space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg p-3 text-sm",
                message.role === Role.USER
                  ? "ml-auto bg-primary text-white"
                  : "bg-gray-200 text-gray-700",
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
