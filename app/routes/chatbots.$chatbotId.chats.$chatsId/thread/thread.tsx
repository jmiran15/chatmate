import { Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
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
import { useSocket } from "~/providers/socket";
import { DateSeparator } from "./DateSeparator";
import MessageComponent from "./Message";
import { UnseenSeparator } from "./UnseenSeparator";
import { useMarkSeen } from "./useMarkSeen";

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
  const [unseenSeparatorInfo, setUnseenSeparatorInfo] = useState<{
    show: boolean;
    count: number;
    oldestUnseenMessageId: string | null;
  }>({ show: false, count: 0, oldestUnseenMessageId: null });
  const { markSeen, hasMarkedSeen } = useMarkSeen(chatId, seen);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });
  const { ref: unseenSeparatorRef, inView: unseenSeparatorInView } = useInView({
    threshold: 0,
  });
  const messagesRef = useRef(thread);

  const handleMarkSeen = useCallback(
    (data: { chatId: string; messageId: string }) => {
      if (sessionId === data.chatId) {
        setThread((prevThread) =>
          prevThread.map((message) =>
            message.id === data.messageId
              ? { ...message, seenByUser: true }
              : message,
          ),
        );
      }
    },
    [sessionId, setThread],
  );

  // optimistically set seen by user
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.on("seenAgentMessage", handleMarkSeen);

    return () => {
      socket.off("seenAgentMessage", handleMarkSeen);
    };
  }, [socket, sessionId]);

  const lastUserMessageIndex = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "user") {
        return i;
      }
    }
    return -1;
  }, [thread]);

  useEffect(() => {
    // get pending ones here via useFetchers
    // const unseenMessages = thread.filter(
    //   (m) => m.role === "user" && !isMessageSeen(m.id),
    // );
    const unseenMessages = thread.filter(
      (m) => m.role === "user" && m.seenByAgent === false,
    );
    if (unseenMessages.length > 0 && !unseenSeparatorInfo.show) {
      setUnseenSeparatorInfo({
        show: true,
        count: unseenMessages.length,
        oldestUnseenMessageId: unseenMessages[0].id,
      });
    }
  }, [thread]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!unseenSeparatorInView && unseenSeparatorInfo.show) {
      timeoutId = setTimeout(() => {
        setUnseenSeparatorInfo((prev) => ({ ...prev, show: false }));
      }, 1000); // 1 second delay
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [unseenSeparatorInView, unseenSeparatorInfo.show]);

  // setting the chat as seen
  useEffect(() => {
    if (inView && !seen && lastUserMessageIndex !== -1 && !hasMarkedSeen) {
      markSeen();
    }
  }, [inView, seen, lastUserMessageIndex, markSeen, hasMarkedSeen]);

  const handleThread = useCallback(
    (data: { sessionId: string; messages: SerializeFrom<Message[]> }) => {
      console.log("handleThread: ", {
        sid: sessionId,
        session: data.sessionId,
      });
      if (sessionId === data.sessionId) {
        setThread((prevThread: SerializeFrom<Message[]>) => {
          const messageMap = new Map(prevThread.map((m) => [m.id, m]));

          data.messages.forEach((newMessage) => {
            if (messageMap.has(newMessage.id)) {
              // If the message already exists, update only new properties
              const existingMessage = messageMap.get(newMessage.id)!;
              messageMap.set(newMessage.id, {
                ...existingMessage,
                ...newMessage,
                seenByAgent: existingMessage.seenByAgent,
                seenByUser: existingMessage.seenByUser,
              });
            } else {
              // If it's a new message, add it to the map
              messageMap.set(newMessage.id, newMessage);
            }
          });

          // Convert the map back to an array and sort by createdAt
          const updatedThread = Array.from(messageMap.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          return updatedThread;
        });
        // scrollThreadToBottom();
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
    let hasRenderedUnseenSeparator = false;

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

      let unseenSeparator: React.ReactNode = null;
      if (
        !hasRenderedUnseenSeparator &&
        unseenSeparatorInfo.show &&
        message.id === unseenSeparatorInfo.oldestUnseenMessageId
      ) {
        unseenSeparator = (
          <div ref={unseenSeparatorRef} key="unseen-separator">
            <UnseenSeparator count={unseenSeparatorInfo.count} />
          </div>
        );
        hasRenderedUnseenSeparator = true;
      }

      const messageComponent = (
        <div key={message.id} data-message-date={message.createdAt}>
          <MessageComponent message={message} />
        </div>
      );

      return (
        <React.Fragment key={message.id}>
          {dateSeparator}
          {unseenSeparator}
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
      <div ref={inViewRef} style={{ height: 1 }} />
    </div>
  );
});

Thread.displayName = "Thread";

export default Thread;
