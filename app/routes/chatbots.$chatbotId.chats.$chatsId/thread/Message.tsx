import { type Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { motion } from "framer-motion";
import { Check, CheckCheck, Eye, Keyboard, Pause, Send } from "lucide-react";
import { DateTime } from "luxon";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { PreviewMarkdown } from "~/components/PreviewMarkdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { TypingInformation } from "./thread";
import { useMarkMessageSeen } from "./useMarkMessagesSeen";

const formatMessageDate = (date: Date) => {
  const messageDate = DateTime.fromJSDate(date);
  const now = DateTime.local();
  const diff = now.diff(messageDate, "minutes").minutes;

  if (diff < 1) {
    return "just now";
  } else if (diff < 60) {
    return `${Math.floor(diff)}m ago`;
  } else {
    return messageDate.toFormat("h:mm a");
  }
};

const TypewriterText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText((prevText) => text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else if (indexRef.current > text.length) {
        setDisplayText((prevText) => text.slice(0, indexRef.current - 1));
        indexRef.current--;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text]);

  return (
    <motion.span>
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        |
      </motion.span>
    </motion.span>
  );
};

const formatTooltipDate = (date: Date | string | null | undefined) => {
  if (!date) return null;
  const dateTime =
    typeof date === "string"
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return dateTime.isValid ? dateTime.toFormat("d LLL 'at' h:mm a") : null;
};

const MessageComponent = memo(
  ({ message }: { message: SerializeFrom<Message & TypingInformation> }) => {
    const { markMessageSeen, isMessageSeen } = useMarkMessageSeen(message);
    const isUser = message.role === "user";
    const isPreview = message.isPreview;

    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    // sometimes the message doesnt exist in the database yet
    useEffect(() => {
      if (inView && isUser && !isMessageSeen && !isPreview) {
        markMessageSeen();
      }
    }, [inView, isUser, isMessageSeen, isPreview, markMessageSeen]);

    const formattedDate = useMemo(
      () => formatMessageDate(new Date(message.createdAt)),
      [message.createdAt],
    );

    const tooltipContent = useMemo(() => {
      const sentDate = formatTooltipDate(message.createdAt);
      const seenDate =
        !isUser && message.seenByUser && message.seenByUserAt
          ? formatTooltipDate(message.seenByUserAt)
          : null;

      if (!sentDate) return null;

      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center">
            <Send className="w-4 h-4 mr-2" />
            <span>Sent on {sentDate}</span>
          </div>
          {seenDate && (
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              <span>Seen on {seenDate}</span>
            </div>
          )}
        </div>
      );
    }, [isUser, message.createdAt, message.seenByUser, message.seenByUserAt]);

    console.log("message: ", message);
    if (message.activity) {
      return <TextSeparator text={message.content} />;
    }

    return (
      <div
        className={cn(
          "flex flex-col w-full items-start justify-start",
          isUser ? "items-end" : "items-start",
        )}
        ref={isUser && !isPreview ? ref : undefined}
      >
        {/* <span>
          {message.id} {message.OPTIMISTIC ? "❌" : "✅"}
        </span> */}
        <div
          className={cn(
            "flex flex-col max-w-[80%] prose prose-zinc border rounded-lg px-3 py-2",
            isUser
              ? isPreview
                ? "bg-primary/90 text-primary-foreground"
                : "bg-primary text-primary-foreground"
              : "bg-muted",
          )}
        >
          <div className="flex flex-wrap items-end justify-end">
            <div
              className={cn(
                "flex-grow min-w-0 mr-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                isPreview && "transition-all duration-200 ease-in-out",
              )}
              style={
                isPreview ? { fontSize: "0.95em", opacity: 0.85 } : undefined
              }
            >
              {isPreview ? (
                <TypewriterText text={message.content} />
              ) : (
                <PreviewMarkdown source={message.content} />
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center whitespace-nowrap text-[10px] text-muted-foreground opacity-80 translate-y-[0.125em] ml-1 self-end flex-shrink-0",
                      "transition-colors duration-200 ease-in-out rounded px-1 py-0.5",
                      "hover:bg-gray-200 dark:hover:bg-gray-700",
                    )}
                  >
                    <span className="mr-1">{formattedDate}</span>
                    {!isUser &&
                      (message.seenByUser ? (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Check className="w-3 h-3 text-muted-foreground" />
                      ))}
                  </div>
                </TooltipTrigger>
                {tooltipContent && (
                  <TooltipContent side="left" align="end">
                    {tooltipContent}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {isUser && isPreview && (
          <motion.div
            className="text-xs font-light text-muted-foreground mt-1 flex items-center"
            style={{ opacity: 0.6 }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {message.isTyping && message.typingState === "typing" ? (
              <>
                <Keyboard className="w-3 h-3 mr-1" />
                <span>User is typing...</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 mr-1" />
                <span>User has typed</span>
              </>
            )}
          </motion.div>
        )}
      </div>
    );
  },
);

MessageComponent.displayName = "MessageComponent";

export default MessageComponent;

interface TextSeparatorProps {
  text: string;
  className?: string;
  lineColor?: string;
  textColor?: string;
}

function TextSeparator({
  text,
  className = "",
  lineColor = "border-gray-300",
  textColor = "text-gray-500",
}: TextSeparatorProps) {
  return (
    <div className={`flex items-center w-full ${className}`}>
      <div className={`flex-grow border-t ${lineColor}`}></div>
      <span className={`flex-shrink mx-4 text-sm font-medium ${textColor}`}>
        {text}
      </span>
      <div className={`flex-grow border-t ${lineColor}`}></div>
    </div>
  );
}
