import { ScrollArea } from "../ui/scroll-area";
import { cn } from "~/lib/utils";
import LoadingMessage from "./loading-message";

export default function Messages({
  messages,
  loading,
  color = "#f97316",
  radius = 0.5,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  loading: boolean;
  color?: string;
  radius?: number;
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
                  message.role === "user"
                    ? "ml-auto text-white"
                    : "text-gray-700",
                )}
                style={{
                  backgroundColor: message.role === "user" ? color : "#e5e7eb",
                  borderRadius: `${radius}rem`,
                }}
              >
                {message.content}
              </div>
            );
          })}
          {loading && <LoadingMessage />}
        </div>
      )}
    </ScrollArea>
  );
}
