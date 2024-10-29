import { Prisma } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useNavigation } from "@remix-run/react";
import { format } from "date-fns";
import { Clipboard, RotateCw } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { copyToClipboard } from "~/utils/clipboard";
import { ChatMessage, MessageRevisionStatus } from "./chat";
import { ChatAction } from "./chat-action";
import { MessageFooter } from "./message-footer";
import { MessageStatusBadge } from "./message-status-badge";

type MessageRevisionWithDocument = SerializeFrom<
  Prisma.MessageRevisionGetPayload<{
    include: {
      document: {
        select: {
          id: true;
          isPending: true;
        };
      };
    };
  }>
>;

export function SingleMessageContent({
  message,
  isUser,
  messageContent,
  showActions,
  toast,
  correspondingQuestion,
  regenerateMessage,
}: {
  message: ChatMessage;
  isUser: boolean;
  messageContent: () => React.ReactNode;
  showActions: boolean;
  toast: ReturnType<typeof useToast>["toast"];
  correspondingQuestion?: string;
  regenerateMessage: ({
    userInput,
    message,
  }: {
    userInput: string;
    message: ChatMessage;
  }) => void;
}) {
  const navigation = useNavigation();
  const isPendingRevisionSubmission =
    navigation.formData &&
    navigation.formData.get("revisionForMessageId") === message.id;

  const noRevisions = message.revisions?.length === 0 || !message.revisions;
  const somePendingRevisions = message.revisions?.some(
    (revision: MessageRevisionWithDocument) => revision.document.isPending,
  );

  const staticStatus: MessageRevisionStatus = noRevisions
    ? "waiting"
    : somePendingRevisions
    ? "processing"
    : "resolved";

  const messageStatus: MessageRevisionStatus = !isUser
    ? message.didNotFulfillQuery
      ? isPendingRevisionSubmission
        ? "processing"
        : staticStatus
      : null
    : null;

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
                    revisionForMessageId={message.id}
                    message={message}
                    regenerateMessage={regenerateMessage}
                  />
                )}
              </div>
              <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap text-right w-full box-border pointer-events-none z-[1]">
                {format(new Date(message.createdAt), "M/d/yyyy, h:mm:ss a")}
              </div>
            </div>
          </HoverCardTrigger>
          {showActions && !isUser && (
            <HoverCardContent
              side="top"
              align={isUser ? "end" : "start"}
              className="py-1 px-0 w-fit"
            >
              <div className="flex items-center">
                <ChatAction
                  text="Copy"
                  icon={<Clipboard className="w-4 h-4" />}
                  onClick={() => copyToClipboard(message.content, toast)}
                />
                {correspondingQuestion && message.id && (
                  <ChatAction
                    text="Regenerate"
                    icon={<RotateCw className={cn("w-4 h-4")} />}
                    onClick={() =>
                      regenerateMessage({
                        userInput: correspondingQuestion,
                        message,
                      })
                    }

                    // disabled={isRegenerating}
                  />
                )}
              </div>
            </HoverCardContent>
          )}
        </HoverCard>
      </div>
    </div>
  );
}
