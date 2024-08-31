import { type Message as PrismaMessage } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetchers, useLoaderData, useParams } from "@remix-run/react";
import debounce from "lodash.debounce";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "~/providers/socket";
import { loader } from "./route";

export const SEND_INTENT = "createMessage";

interface SeenAgentMessage {
  chatId: string;
  messageId: string;
  seenAt: string;
}

type TypingState = "typing" | "typed";

interface UserTyping {
  chatId: string;
  isTyping: boolean;
  typingState?: TypingState;
  typedContents?: string;
}

export interface TypingInformation {
  isPreview?: boolean;
  isTyping?: boolean;
  typingState?: TypingState;
  typedContents?: string;
}

export interface StreamingInformation {
  streaming?: boolean;
  loading?: boolean;
  error?: boolean;
}

interface PrismaMessageWithTyping
  extends PrismaMessage,
    TypingInformation,
    StreamingInformation {}
export type Message = SerializeFrom<PrismaMessageWithTyping>;

function usePendingMessages() {
  return useFetchers()
    .filter(
      (fetcher) =>
        fetcher.state === "submitting" &&
        fetcher.formData &&
        fetcher.formData.get("intent") === SEND_INTENT,
    )
    .map((fetcher) => {
      const message = JSON.parse(String(fetcher.formData!.get("message"))!);
      return { ...message, OPTIMISTIC: true };
    })
    .sort(
      (a, b) =>
        DateTime.fromISO(a.createdAt).diff(DateTime.fromISO(b.createdAt))
          .milliseconds,
    );
}

export default function useThread() {
  const { messages } = useLoaderData<typeof loader>();
  const [thread, setThread] = useState<Message[]>(() => messages ?? []);
  const socket = useSocket();
  const { chatsId: chatId } = useParams();
  const lastTypingDataRef = useRef<Pick<
    UserTyping,
    "isTyping" | "typingState" | "typedContents"
  > | null>(null);

  // keep thread in sync with loader (revalidation and initial loads)
  useEffect(() => {
    setThread(messages);
  }, [messages]);
  const optimisticMessages = usePendingMessages();

  useEffect(() => {
    if (optimisticMessages.length === 0) return;

    setThread((currentThread) => {
      const newThread = [...currentThread];
      const messagesToInsert = [...optimisticMessages];

      messagesToInsert.sort(
        (a, b) =>
          DateTime.fromISO(a.createdAt).diff(DateTime.fromISO(b.createdAt))
            .milliseconds,
      );

      for (const message of messagesToInsert) {
        const insertIndex = newThread.findIndex(
          (m) =>
            DateTime.fromISO(m.createdAt).diff(
              DateTime.fromISO(message.createdAt),
            ).milliseconds > 0,
        );

        if (insertIndex === -1) {
          newThread.push(message);
        } else {
          newThread.splice(insertIndex, 0, message);
        }
      }

      return newThread;
    });
  }, [optimisticMessages.length]);

  const handleMarkSeen = useCallback(
    (data: SeenAgentMessage) => {
      if (chatId === data.chatId) {
        setThread((prevThread) => {
          return prevThread.map((message) => {
            return message.id === data.messageId
              ? {
                  ...message,
                  seenByUser: true,
                  seenByUserAt: data.seenAt,
                }
              : message;
          });
        });
      }
    },
    [chatId, setThread],
  );

  const debouncedSetThread = useCallback(
    debounce((updateFn: (prevThread: Message[]) => Message[]) => {
      setThread(updateFn);
    }, 50),
    [],
  );

  const handleUserTyping = useCallback(
    (data: UserTyping) => {
      if (chatId !== data.chatId) return;

      lastTypingDataRef.current = data;

      debouncedSetThread((prevThread) => {
        const lastMessage = prevThread[prevThread.length - 1];
        const isUserMessage = lastMessage?.role === "user";

        if (isUserMessage && lastMessage.isPreview) {
          if (!data.isTyping) {
            return prevThread.slice(0, -1);
          } else {
            return [
              ...prevThread.slice(0, -1),
              {
                ...lastMessage,
                isTyping: data.isTyping,
                typingState: data.typingState,
                content: data.typedContents ?? "",
                updatedAt: DateTime.now().toISO(),
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
              content: data.typedContents ?? "",
              createdAt: DateTime.now().toISO(),
              updatedAt: DateTime.now().toISO(),
              chatId: chatId,
              clusterId: null,
              seenByUser: null,
              seenByAgent: null,
              seenByUserAt: null,
              activity: null,
            },
          ];
        }

        return prevThread;
      });
    },
    [chatId, debouncedSetThread],
  );

  const handleThread = useCallback(
    (data: { chatId: string; message: Message }) => {
      if (chatId === data.chatId) {
        setThread((prevThread) => {
          const newMessage = data.message;
          const newMessageTime = DateTime.fromISO(
            newMessage.createdAt,
          ).toMillis();

          const existingIndex = prevThread.findIndex(
            (m) => m.id === newMessage.id,
          );
          if (existingIndex !== -1) {
            return prevThread.map((message, index) =>
              index === existingIndex
                ? {
                    ...message,
                    ...newMessage,
                    seenByAgent: message.seenByAgent,
                    seenByUser: message.seenByUser,
                    seenByUserAt:
                      message.seenByUserAt || newMessage.seenByUserAt,
                  }
                : message,
            );
          }

          let low = 0;
          let high = prevThread.length;
          while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (
              DateTime.fromISO(prevThread[mid].createdAt).toMillis() >
              newMessageTime
            ) {
              high = mid;
            } else {
              low = mid + 1;
            }
          }

          return [
            ...prevThread.slice(0, low),
            newMessage,
            ...prevThread.slice(low),
          ];
        });
      }
    },
    [chatId, setThread],
  );

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.on("seenAgentMessage", handleMarkSeen);
    socket.on("userTyping", handleUserTyping);
    socket.on("new message", handleThread);

    return () => {
      socket.off("seenAgentMessage", handleMarkSeen);
      socket.off("userTyping", handleUserTyping);
      socket.off("new message", handleThread);
    };
  }, [socket, chatId, handleMarkSeen, handleUserTyping, handleThread]);

  return {
    thread,
  };
}
