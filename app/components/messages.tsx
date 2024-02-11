import { Message, Role } from "@prisma/client";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "~/lib/utils";

export default function Messages({
  messages,
  loading,
  color,
  radius,
}: {
  messages: Message[] | { role: "user" | "assistant"; content: string }[];
  loading: boolean;
  color: string;
  radius: number;
}) {
  return (
    <ScrollArea className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <p className="">No messages yet</p>
      ) : (
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "p-3 text-sm",
                  message.role === Role.USER || message.role === "user"
                    ? "ml-auto text-white"
                    : "text-gray-700",
                )}
                style={{
                  backgroundColor:
                    message.role === Role.USER || message.role === "user"
                      ? color
                      : "#e5e7eb",
                  borderRadius: `${radius}rem`,
                }}
              >
                {message.content}
              </div>
            );
          })}
          {loading ? (
            <div
              key="loading-assistant"
              className="flex space-x-2 justify-center items-center bg-gray-200 w-min rounded-lg p-3 text-sm"
            >
              <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 bg-gray-700 rounded-full animate-bounce"></div>
            </div>
          ) : (
            <></>
          )}
        </div>
      )}
    </ScrollArea>
  );
}
