import { format } from "date-fns";
import { Clipboard } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { copyToClipboard } from "~/utils/clipboard";
import { ChatAction } from "./chat-action";
import { MessageFooter } from "./message-footer";
import { MessageStatus, MessageStatusBadge } from "./message-status-badge";

export function SingleMessageContent({
  message,
  isUser,
  messageContent,
  showActions,
  toast,
  correspondingQuestion,
}: {
  message: any;
  isUser: boolean;
  messageContent: () => React.ReactNode;
  showActions: boolean;
  toast: ReturnType<typeof useToast>["toast"];
  correspondingQuestion?: string;
}) {
  const messageStatus: MessageStatus = !isUser
    ? message.didNotFulfillQuery
      ? message.resolved
        ? "resolved"
        : "notProperlyAnswered"
      : "regular"
    : "regular";

  return (
    <div className="space-y-5">
      <div
        className={
          isUser
            ? "flex flex-row-reverse"
            : "flex flex-row last:animate-[slide-in_ease_0.3s]"
        }
      >
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <div
              className={cn(
                "max-w-[80%] flex flex-col items-start",
                isUser && "items-end",
              )}
            >
              <div
                className={cn(
                  "box-border max-w-full text-sm select-text relative break-words rounded-lg px-3 py-2 space-y-2",
                  isUser
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {!isUser && <MessageStatusBadge status={messageStatus} />}
                {messageContent()}
                {!isUser && (
                  <MessageFooter
                    status={messageStatus}
                    question={correspondingQuestion}
                  />
                )}
              </div>
              <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap text-right w-full box-border pointer-events-none z-[1]">
                {format(new Date(message.createdAt), "M/d/yyyy, h:mm:ss a")}
              </div>
            </div>
          </HoverCardTrigger>
          {showActions ? (
            <HoverCardContent
              side="top"
              align={isUser ? "end" : "start"}
              className="py-1 px-0 w-fit"
            >
              <div className="flex items-center divide-x">
                <>
                  <ChatAction
                    text={"Copy"}
                    icon={<Clipboard className="w-4 h-4" />}
                    onClick={() => copyToClipboard(message.content, toast)}
                  />
                </>
              </div>
            </HoverCardContent>
          ) : (
            <></>
          )}
        </HoverCard>
      </div>
    </div>
  );
}
