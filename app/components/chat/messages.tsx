import { ScrollArea } from "../ui/scroll-area";
import { cn } from "~/lib/utils";
import LoadingMessage from "./loading-message";
import { CardContent } from "../ui/card";

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
    <CardContent className="flex-1 overflow-auto">
      <div className="space-y-4 ">
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
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                  // style={{
                  //   backgroundColor: message.role === "user" ? color : "#e5e7eb",
                  //   borderRadius: `${radius}rem`,
                  // }}
                >
                  {message.content}
                </div>
              );
            })}
            {loading && <LoadingMessage />}
          </>
        )}
      </div>
    </CardContent>
  );
}
