import { Message } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import debounce from "lodash.debounce";
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

export interface TypingInformation {
  isPreview?: boolean; // indicates if it is a typing message
  isTyping?: boolean;
  typingState?: "typing" | "typed";
  typedContents?: string;
}

const Thread = forwardRef(function Thread(
  {
    thread,
    setThread,
    seen = false,
    scrollThreadToBottom,
  }: {
    thread: SerializeFrom<(Message & TypingInformation)[]>;
    setThread: React.Dispatch<
      React.SetStateAction<SerializeFrom<(Message & TypingInformation)[]>>
    >;
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
    (data: { chatId: string; messageId: string; seenAt: string }) => {
      if (chatId === data.chatId) {
        setThread((prevThread) =>
          prevThread.map((message) =>
            message.id === data.messageId
              ? {
                  ...message,
                  seenByUser: true,
                  seenByUserAt: data.seenAt,
                }
              : message,
          ),
        );
      }
    },
    [chatId, setThread],
  );

  const lastTypingDataRef = useRef<{
    isTyping: boolean;
    typingState?: "typing" | "typed";
    typedContents?: string;
  } | null>(null);

  const debouncedSetThread = useCallback(
    debounce(
      (
        updateFn: (
          prevThread: SerializeFrom<(Message & TypingInformation)[]>,
        ) => SerializeFrom<(Message & TypingInformation)[]>,
      ) => {
        setThread(updateFn);
      },
      50,
    ),
    [],
  );

  const handleUserTyping = useCallback(
    (data: {
      chatId: string;
      isTyping: boolean;
      typingState?: "typing" | "typed";
      typedContents?: string;
    }) => {
      if (chatId !== data.chatId) return;

      lastTypingDataRef.current = data;

      debouncedSetThread((prevThread) => {
        const lastMessage = prevThread[prevThread.length - 1];

        if (lastMessage?.role === "user" && lastMessage.isPreview) {
          if (!data.isTyping) {
            return prevThread.slice(0, -1);
          } else {
            return [
              ...prevThread.slice(0, -1),
              {
                ...lastMessage,
                isTyping: data.isTyping,
                typingState: data.typingState,
                content: data.typedContents ?? "", // Ensure content is always a string
                updatedAt: new Date().toISOString(),
              },
            ];
          }
        } else if (data.typingState) {
          return [
            ...prevThread,
            {
              id: `preview-${Date.now()}`,
              role: "user",
              isPreview: true,
              isTyping: data.isTyping,
              typingState: data.typingState,
              content: data.typedContents ?? "", // Ensure content is always a string
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              chatId: chatId,
              clusterId: null,
              seenByUser: null,
              seenByAgent: null,
              seenByUserAt: null, // Add this line
            },
          ];
        }

        return prevThread;
      });
    },
    [chatId, debouncedSetThread],
  );

  // optimistically set seen by user
  useEffect(() => {
    if (!socket || !chatId) return;

    socket.on("seenAgentMessage", handleMarkSeen);
    socket.on("userTyping", handleUserTyping);

    return () => {
      socket.off("seenAgentMessage", handleMarkSeen);
      socket.off("userTyping", handleUserTyping);
    };
  }, [socket, chatId]);

  const lastUserMessageIndex = useMemo(() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "user") {
        return i;
      }
    }
    return -1;
  }, [thread]);

  useEffect(() => {
    const unseenMessages = thread.filter(
      (m) => m.role === "user" && m.seenByAgent === false,
    );
    if (unseenMessages.length > 0) {
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
    (data: { chatId: string; messages: SerializeFrom<Message[]> }) => {
      if (chatId === data.chatId) {
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
                seenByUserAt:
                  existingMessage.seenByUserAt || newMessage.seenByUserAt,
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
        scrollThreadToBottom();
      }
    },
    [chatId, setThread, scrollThreadToBottom],
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
