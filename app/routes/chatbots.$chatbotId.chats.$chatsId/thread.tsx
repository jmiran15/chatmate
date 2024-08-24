import { Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher, useParams } from "@remix-run/react";
import { DateTime } from "luxon";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { PreviewMarkdown } from "~/components/MarkdownTest";
import { cn } from "~/lib/utils";
import { useSocket } from "~/providers/socket";

const useMarkSeen = (chatId: string | undefined, seen: boolean | null) => {
  const fetcher = useFetcher({ key: `mark-seen-${chatId}` });
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  useEffect(() => {
    setHasMarkedSeen(seen === true);
  }, [chatId, seen]);

  const markSeen = useCallback(() => {
    if (!seen && !hasMarkedSeen && chatId) {
      fetcher.submit(
        { chatId, intent: "mark-seen" },
        {
          method: "post",
          preventScrollReset: true,
        },
      );
      setHasMarkedSeen(true);
    }
  }, [seen, hasMarkedSeen, chatId, fetcher]);

  return { markSeen, hasMarkedSeen };
};

const formatMessageDate = (date: Date) => {
  const messageDate = DateTime.fromJSDate(date);
  const now = DateTime.local();
  const diff = now.diff(messageDate, ["minutes", "hours", "days"]);

  // Ensure the message date is not in the future
  if (messageDate > now) {
    return "just now";
  }

  if (messageDate.hasSame(now, "day")) {
    if (diff.minutes < 1) {
      return "just now";
    } else if (diff.minutes < 60) {
      return `${Math.floor(diff.minutes)}m ago`;
    } else {
      return messageDate.toFormat("h:mm a"); // Today: 2:30 PM
    }
  } else if (messageDate.hasSame(now.minus({ days: 1 }), "day")) {
    return messageDate.toFormat("h:mm a"); // Yesterday's time
  } else if (messageDate.hasSame(now, "year")) {
    return messageDate.toFormat("MMM d, h:mm a"); // This year: Jun 15, 2:30 PM
  } else {
    return messageDate.toFormat("MMM d, yyyy, h:mm a"); // Other years: Jun 15, 2022, 2:30 PM
  }
};

export const DateSeparator = ({ date }: { date: Date }) => {
  const messageDate = DateTime.fromJSDate(date);
  const now = DateTime.local();

  let formattedDate;
  if (messageDate.hasSame(now, "day")) {
    formattedDate = "Today";
  } else if (messageDate.hasSame(now.minus({ days: 1 }), "day")) {
    formattedDate = "Yesterday";
  } else {
    formattedDate = messageDate.toFormat("MMMM d, yyyy");
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
        {formattedDate}
      </div>
    </div>
  );
};

const MessageComponent = React.memo(
  ({
    message,
    isUser,
    isLastUserMessage,
    seen,
    hasMarkedSeen,
    inViewRef,
  }: {
    message: SerializeFrom<Message>;
    isUser: boolean;
    isLastUserMessage: boolean;
    seen: boolean | null;
    hasMarkedSeen: boolean;
    inViewRef: (node?: Element | null) => void;
  }) => {
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
        ref={
          isLastUserMessage && !seen && !hasMarkedSeen ? inViewRef : undefined
        }
      >
        <div
          className={cn(
            "max-w-[80%] prose prose-zinc border rounded-lg p-2",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          <PreviewMarkdown source={message.content} />
        </div>
        <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap box-border pointer-events-none z-[1]">
          {formattedDate}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.isLastUserMessage === nextProps.isLastUserMessage &&
      prevProps.seen === nextProps.seen &&
      prevProps.hasMarkedSeen === nextProps.hasMarkedSeen
    );
  },
);

MessageComponent.displayName = "MessageComponent";

const Thread = forwardRef(function Thread(
  {
    thread,
    setThread,
    sessionId,
    seen = false,
    scrollThreadToBottom,
  }: {
    thread: SerializeFrom<Message[]>;
    setThread: React.Dispatch<React.SetStateAction<SerializeFrom<Message[]>>>;
    sessionId: string | null;
    seen: boolean | null;
    scrollThreadToBottom: () => void;
  },
  ref: React.Ref<HTMLDivElement>,
) {
  const socket = useSocket();
  const { chatsId: chatId } = useParams();
  const { markSeen, hasMarkedSeen } = useMarkSeen(chatId, seen);

  const lastUserMessageIndex = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "user") {
        return i;
      }
    }
    return -1;
  }, [thread]);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !seen && lastUserMessageIndex !== -1 && !hasMarkedSeen) {
      markSeen();
    }
  }, [inView, seen, lastUserMessageIndex, markSeen, hasMarkedSeen]);

  const handleThread = useCallback(
    (data: { sessionId: string; messages: SerializeFrom<Message[]> }) => {
      if (sessionId === data.sessionId) {
        setThread((prevThread: SerializeFrom<Message[]>) => {
          const newThread = [...prevThread, ...data.messages];
          // Remove duplicates based on message id
          return Array.from(new Map(newThread.map((m) => [m.id, m])).values());
        });
        scrollThreadToBottom();
      }
    },
    [sessionId, setThread, scrollThreadToBottom],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("messages", handleThread);

    return () => {
      socket.off("messages", handleThread);
    };
  }, [socket, handleThread]);

  const messagesRef = useRef(thread);

  useEffect(() => {
    messagesRef.current = thread;
  }, [thread]);

  useEffect(() => {
    const shouldScroll = messagesRef.current.length !== thread.length;
    if (shouldScroll) {
      scrollThreadToBottom();
    }
  }, [thread, scrollThreadToBottom]);

  if (!chatId) {
    return null;
  }

  const renderMessagesWithSeparators = () => {
    let lastMessageDate: DateTime | null = null;
    return thread.map((message, index) => {
      const currentMessageDate = DateTime.fromJSDate(
        new Date(message.createdAt),
      );
      let dateSeparator: React.ReactNode = null;

      if (
        !lastMessageDate ||
        !currentMessageDate.hasSame(lastMessageDate, "day")
      ) {
        dateSeparator = (
          <div
            key={`date-${message.createdAt}`}
            data-date-separator={message.createdAt}
          >
            <DateSeparator date={new Date(message.createdAt)} />
          </div>
        );
        lastMessageDate = currentMessageDate;
      }

      const messageComponent = (
        <div key={message.id} data-message-date={message.createdAt}>
          <MessageComponent
            message={message}
            isUser={message.role === "user"}
            isLastUserMessage={index === lastUserMessageIndex}
            seen={seen}
            hasMarkedSeen={hasMarkedSeen}
            inViewRef={inViewRef}
          />
        </div>
      );

      return (
        <React.Fragment key={message.id}>
          {dateSeparator}
          {messageComponent}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto relative overscroll-none overflow-x-hidden pb-10 p-5 w-full"
    >
      <div className="space-y-5 w-full">{renderMessagesWithSeparators()}</div>
    </div>
  );
});

Thread.displayName = "Thread";

export default Thread;
