import { type Message as PrismaMessage } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetchers, useLoaderData, useParams } from "@remix-run/react";
import debounce from "lodash.debounce";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "~/providers/socket";
import { loader } from "./route";

export const SEND_INTENT = "createMessage";

// TODO - use zod for types - extremely strongly type everything
// TODO - add return types

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

// if not there or false - means the message is completed - if streaming is true, means the chatbot is typing/streaming response
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

export default function useThread() {
  const { messages } = useLoaderData<typeof loader>();
  const [thread, setThread] = useState<Message[]>(() => messages ?? []);
  const socket = useSocket();
  const { chatsId: chatId } = useParams();
  const fetchers = useFetchers();
  const lastTypingDataRef = useRef<Pick<
    UserTyping,
    "isTyping" | "typingState" | "typedContents"
  > | null>(null);

  // keep thread in sync with loader (revalidation and initial loads)
  useEffect(() => {
    setThread(messages);
  }, [messages]);

  const optimisticMessages = fetchers
    .filter(
      (fetcher) =>
        fetcher.state === "submitting" &&
        fetcher.formData &&
        fetcher.formData.get("intent") === SEND_INTENT,
    )
    .map((fetcher) => {
      const message = JSON.parse(String(fetcher.formData!.get("message"))!);
      return message;
    })
    .sort(
      (a, b) =>
        DateTime.fromISO(a.createdAt).diff(DateTime.fromISO(b.createdAt))
          .milliseconds,
    );

  useEffect(() => {
    if (optimisticMessages.length === 0) return;

    setThread((currentThread) => {
      const newThread = [...currentThread];

      for (const message of optimisticMessages) {
        const insertIndex = newThread.findIndex(
          (m) =>
            DateTime.fromISO(m.createdAt) > DateTime.fromISO(message.createdAt),
        );

        if (insertIndex === -1) {
          newThread.push(message);
        } else {
          newThread.splice(insertIndex, 0, message);
        }
      }

      return newThread;
    });
  }, [optimisticMessages]);

  // SOCKET.IO HANDLERS
  const handleMarkSeen = useCallback(
    (data: SeenAgentMessage) => {
      if (chatId === data.chatId) {
        console.log("handleMarkSeen", data);

        setThread((prevThread) =>
          prevThread.map((message) => {
            if (message.id === data.messageId) {
              console.log("seen message", message);
            }
            return message.id === data.messageId
              ? {
                  ...message,
                  seenByUser: true,
                  seenByUserAt: data.seenAt,
                }
              : message;
          }),
        );
      }
    },
    [chatId, setThread],
  );

  console.log("thread", thread);

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

  //   const handleThread = useCallback(
  //     (data: MessagesEvent) => {
  //       if (chatId === data.chatId) {
  //         setThread((prevThread: Message[]) => {
  //           const messageMap = new Map(prevThread.map((m) => [m.id, m]));

  //           data.messages.forEach((newMessage) => {
  //             if (messageMap.has(newMessage.id)) {
  //               // If the message already exists, update only new properties
  //               const existingMessage = messageMap.get(newMessage.id)!;
  //               messageMap.set(newMessage.id, {
  //                 ...existingMessage,
  //                 ...newMessage,
  //                 seenByAgent: existingMessage.seenByAgent,
  //                 seenByUser: existingMessage.seenByUser,
  //                 seenByUserAt:
  //                   existingMessage.seenByUserAt || newMessage.seenByUserAt,
  //               });
  //             } else {
  //               // If it's a new message, add it to the map
  //               messageMap.set(newMessage.id, newMessage);
  //             }
  //           });

  //           // Convert the map back to an array and sort by createdAt
  //           const updatedThread = Array.from(messageMap.values()).sort(
  //             (a, b) =>
  //               new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  //           );

  //           return updatedThread;
  //         });
  //         // TODO - scrollThreadToBottom(); ?
  //       }
  //     },
  //     [chatId, setThread],
  //   );

  const handleThread = useCallback(
    (data: { chatId: string; message: Message }) => {
      if (chatId === data.chatId) {
        setThread((prevThread) => {
          const newMessage = data.message;
          const newMessageTime = new Date(newMessage.createdAt).getTime();

          // Check if the message already exists
          const existingIndex = prevThread.findIndex(
            (m) => m.id === newMessage.id,
          );
          if (existingIndex !== -1) {
            // Update existing message
            const updatedThread = [...prevThread];
            updatedThread[existingIndex] = {
              ...updatedThread[existingIndex],
              ...newMessage,
              seenByAgent: updatedThread[existingIndex].seenByAgent,
              seenByUser: updatedThread[existingIndex].seenByUser,
              seenByUserAt:
                updatedThread[existingIndex].seenByUserAt ||
                newMessage.seenByUserAt,
            };
            return updatedThread;
          }

          // Find the correct insertion position
          let insertIndex = prevThread.length;
          for (let i = prevThread.length - 1; i >= 0; i--) {
            const currentMessageTime = new Date(
              prevThread[i].createdAt,
            ).getTime();
            if (currentMessageTime <= newMessageTime) {
              insertIndex = i + 1;
              break;
            }
          }

          // Insert the new message at the correct position
          const updatedThread = [...prevThread];
          updatedThread.splice(insertIndex, 0, newMessage);
          return updatedThread;
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
