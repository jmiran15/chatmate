import { type Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { motion } from "framer-motion";
import { Check, CheckCheck, Keyboard, Pause } from "lucide-react";
import { DateTime } from "luxon";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { PreviewMarkdown } from "~/components/PreviewMarkdown";
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

const MessageComponent = memo(
  ({ message }: { message: SerializeFrom<Message & TypingInformation> }) => {
    const { markMessageSeen, isMessageSeen } = useMarkMessageSeen(message);
    const isUser = message.role === "user";
    const isPreview = message.isPreview;

    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    useEffect(() => {
      if (inView && isUser && !isMessageSeen && !isPreview) {
        markMessageSeen();
      }
    }, [inView, isUser, isMessageSeen, isPreview, markMessageSeen]);

    const formattedDate = useMemo(
      () => formatMessageDate(new Date(message.createdAt)),
      [message.createdAt],
    );

    return (
      <div
        className={cn(
          "flex flex-col w-full items-start justify-start",
          isUser ? "items-end" : "items-start",
        )}
        ref={isUser && !isPreview ? ref : undefined}
      >
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
            <div className="flex items-center whitespace-nowrap text-[10px] text-muted-foreground opacity-80 translate-y-[0.125em] ml-1 self-end flex-shrink-0">
              <span className="mr-1">{formattedDate}</span>
              {!isUser &&
                (message.seenByUser ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : (
                  <Check className="w-3 h-3 text-muted-foreground" />
                ))}
            </div>
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
