import { Message, Role } from "@prisma/client";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "~/lib/utils";

export default function Messages({
  messages,
}: {
  messages: Message[] | { role: "user" | "assistant"; content: string }[];
}) {
  return (
    <ScrollArea className="flex-1 overflow-y-auto py-4 px-16">
      {messages.length === 0 ? (
        <p className="">No messages yet</p>
      ) : (
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => {
            console.log(
              "message",
              message,
              message.role === Role.USER || message.role === "user",
            );
            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg p-3 text-sm",
                  message.role === Role.USER || message.role === "user"
                    ? "ml-auto bg-primary text-white"
                    : "bg-gray-200 text-gray-700",
                )}
              >
                {message.content}
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
