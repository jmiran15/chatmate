import { cn } from "~/lib/utils";
import LoadingMessage from "./loading-message";
import { Chatbot } from "@prisma/client";

export default function Messages({
  messages,
  loading,
  chatbot,
}: {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  loading: boolean;
  chatbot: Chatbot;
}) {
  return (
    <div className="space-y-4 h-full lg:overflow-y-auto p-6 w-full">
      {messages.length === 0 ? (
        <p className="">No messages yet</p>
      ) : (
        <>
          {messages.map((message, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto text-primary-foreground"
                    : "",
                )}
                style={{
                  backgroundColor:
                    message.role === "user"
                      ? chatbot.color
                      : "hsl(var(--muted))",
                }}
              >
                {message.content}
              </div>
            );
          })}
          {loading ? <LoadingMessage /> : null}
        </>
      )}
    </div>
  );
}
