import { createId } from "@paralleldrive/cuid2";
import { Prisma, TicketStatus } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { prisma } from "~/db.server";
import { useScrollToBottom } from "~/hooks/useScroll";
import { useSocket } from "~/providers/socket";
import { useMobileScreen } from "~/utils/mobile";
import AnonSidebar from "./anon-sidebar";
import MobileThread from "./mobile-thread";
import PromptInput from "./prompt-input";
import {
  connectLabel,
  createLabel,
  deleteChat,
  deleteLabel,
  disconnectLabel,
  getChatInfo,
  markChatAsSeen,
  updateChatStatus,
  updateLabel,
} from "./queries.server";
import ScrollToBottomButton from "./ScrollToBottomButton";
import Subheader from "./subheader";
import { DateSeparator } from "./thread/DateSeparator";
import Thread from "./thread/thread";
import useAgent from "./use-agent";
import useThread from "./useThread";

// TODO - export this stuff out of this file - file is too long (loader, actions, etc...)
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chat = await getChatInfo!(chatsId);

  if (!chat) {
    throw new Error("Chat not found");
  }

  // TODO - defer
  const anonUser = chat.sessionId
    ? await prisma.anonymousUser.findUnique({
        where: {
          sessionId: chat.sessionId,
        },
      })
    : null;

  const API_PATH =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE
      : process.env.PROD_BASE;

  return json({
    messages: chat.messages,
    chatbot: chat.chatbot,
    chat,
    anonUser,
    API_PATH,
  });
};

const getStarred = (searchParams: URLSearchParams): "1" | "0" =>
  String(searchParams.get("starred")) === "1" ? "1" : "0";

export const getCreatedAt = (searchParams: URLSearchParams): "asc" | "desc" =>
  String(searchParams.get("createdAt")) === "asc" ? "asc" : "desc";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const { chatbotId, chatsId } = params;
  const { searchParams } = new URL(request.url);

  if (!chatbotId) {
    throw new Error("Chatbot id missing");
  }

  if (!chatsId) {
    throw new Error("Chat id missing");
  }

  switch (intent) {
    case "archive-chat-thread": {
      const chatId = String(formData.get("chatId"));

      const starred = getStarred(searchParams);
      const createdAt = getCreatedAt(searchParams);
      const starredQuery = starred === "1" ? { starred: true } : {};
      const createdAtQuery = {
        createdAt: (createdAt === "asc" ? "asc" : "desc") as Prisma.SortOrder,
      };

      const nextChatId = await deleteChat!({
        chatId,
        chatbotId,
        starredQuery,
        createdAtQuery,
      });

      if (nextChatId) {
        return redirect(
          `/chatbots/${chatbotId}/chats/${nextChatId}?${searchParams.toString()}`,
        );
      } else {
        return redirect(
          `/chatbots/${chatbotId}/chats?${searchParams.toString()}`,
        );
      }
    }
    case "mark-seen": {
      const chatId = String(formData.get("chatId"));
      return await markChatAsSeen!({ chatId });
    }
    case "create-label": {
      const name = String(formData.get("label-name"));
      const label = await createLabel!({ name, chatbotId });
      return json({ label });
    }
    case "update-label": {
      const labelId = String(formData.get("label-id"));
      const name = String(formData.get("label-name"));
      const color = String(formData.get("label-color"));
      const label = await updateLabel!({ labelId, name, color });
      return json({ label });
    }
    case "delete-label": {
      const labelId = String(formData.get("label-id"));
      const label = await deleteLabel!({ labelId });
      return json({ label });
    }
    case "connect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await connectLabel!({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "disconnect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await disconnectLabel!({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "update-status": {
      const status = String(formData.get("status")) as TicketStatus;
      const chat = await updateChatStatus!({ chatId: chatsId, status });
      return json({ chat });
    }
    case "mark-user-messages-seen": {
      const id = String(formData.get("messageId"));

      try {
        await prisma.message.update({
          where: {
            id,
            role: "user",
            chatId: chatsId,
            seenByAgent: false,
          },
          data: {
            seenByAgent: true,
          },
        });
      } catch (error) {
        console.error("Failed to mark message as seen:", error);
      }
      return json({ success: true });
    }
    case "createMessage": {
      const message = JSON.parse(String(formData.get("message")));

      const createdMessage = await prisma.message.create({
        data: {
          ...message,
        },
      });

      return json({ message: createdMessage });
    }
    default:
      throw new Error("undefined intent");
  }
};

export default function ChatRoute() {
  const { chatbot, chat, anonUser } = useLoaderData<typeof loader>();
  const { thread } = useThread();
  const isMobile = useMobileScreen();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputContainer = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const [userInput, setUserInput] = useState("");
  const {
    // setAutoScroll,
    scrollRef: threadRef,
    scrollDomToBottom: scrollThreadToBottom,
  } = useScrollToBottom();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [promptInputHeight, setPromptInputHeight] = useState(
    () => inputContainer.current?.offsetHeight ?? 0,
  );
  const [floatingDateState, setFloatingDateState] = useState({
    date: null as Date | null,
    show: false,
    y: 0,
  });
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const submit = useSubmit();
  const { hasJoined, joinChat } = useAgent({
    chatId: chat?.id,
    submit,
  });
  const navigation = useNavigation();
  const SEND_INTENT = "createMessage";

  const updateFloatingDate = useCallback(() => {
    if (!threadRef.current) return;

    const target = threadRef.current;
    const messages = target.querySelectorAll("[data-message-date]");
    const threadRect = target.getBoundingClientRect();

    let currentDate: Date | null = null;
    let currentDateY = 0;
    let nextDateY = Infinity;

    for (let i = 0; i < messages.length; i++) {
      const messageRect = messages[i].getBoundingClientRect();
      const messageTop = messageRect.top - threadRect.top;
      const messageBottom = messageRect.bottom - threadRect.top;

      if (messageBottom > 0 && messageTop < threadRect.height) {
        const messageDate = new Date(
          messages[i].getAttribute("data-message-date") || "",
        );

        if (
          !currentDate ||
          messageDate.toDateString() !== currentDate.toDateString()
        ) {
          if (!currentDate) {
            currentDate = messageDate;
            currentDateY = Math.max(0, messageTop);
          } else {
            nextDateY = Math.max(0, messageTop);
            break;
          }
        }
      }
    }

    if (currentDate) {
      const threadHeight = threadRect.height;
      const visibilityThreshold = threadHeight * 0.1;
      const show =
        currentDateY < visibilityThreshold && nextDateY > visibilityThreshold;

      setFloatingDateState({
        date: currentDate,
        show: show,
        y: Math.max(0, Math.min(currentDateY, nextDateY - 50)),
      });

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setFloatingDateState((prev) => ({ ...prev, show: false }));
      }, 2000);
    } else {
      setFloatingDateState((prev) => ({ ...prev, show: false }));
    }
  }, [threadRef]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" && e.ctrlKey) {
        setFloatingDateState((prev) => ({ ...prev, show: !prev.show }));
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (inputContainer.current) {
      setPromptInputHeight(inputContainer.current.offsetHeight);
    }
  }, [userInput]);

  useEffect(() => {
    if (threadRef.current) {
      const { scrollHeight, clientHeight } = threadRef.current;
      setShowScrollButton(scrollHeight > clientHeight);
    }
  }, [threadRef.current?.scrollHeight, threadRef.current?.clientHeight]);

  // TODO - can make this pure? i.e no sideEffects - take everything in as params - input message + thread
  // TODO - then we can just put it in the prompt input component?
  function sendMessage() {
    if (!userInput || userInput.trim() === "") return false;
    // const formattedDate = DateTime.now().toISO();
    const currentDate = DateTime.now();

    const newMessage = {
      id: createId(),
      content: userInput,
      role: "assistant",
      createdAt: currentDate,
      updatedAt: currentDate,
      chatId: chat.id,
      seenByUser: false,
      seenByAgent: true,
    };

    submit(
      {
        intent: SEND_INTENT,
        message: JSON.stringify(newMessage),
      },
      {
        method: "POST",
      },
    );

    // socket
    if (socket) {
      // socket.emit("messages", {
      //   chatId: chat?.id,
      //   messages: [...thread, newMessage],
      // });
      socket.emit("new message", {
        chatId: chat?.id,
        message: newMessage,
      });
    }
  }

  // TODO - this can probably be inside the promtp input component
  useEffect(() => {
    if (
      navigation.state === "submitting" &&
      navigation.formData &&
      navigation.formData.get("intent") === SEND_INTENT
    ) {
      setUserInput("");
    }
  }, [navigation]);

  const handleScroll = useCallback(() => {
    if (!threadRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!atBottom);
    updateFloatingDate();
  }, [threadRef, updateFloatingDate]);

  useEffect(() => {
    const threadElement = threadRef.current;
    if (threadElement) {
      threadElement.addEventListener("scroll", handleScroll);
      return () => {
        threadElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return isMobile ? (
    <MobileThread thread={thread} chat={chat} chatbot={chatbot} />
  ) : (
    <div className="flex flex-col col-span-7 overflow-y-auto h-full">
      <Subheader chat={chat} />
      <div className="grid grid-cols-10 flex-1 overflow-y-auto">
        <div className="flex flex-col col-span-7 overflow-y-auto h-full relative w-full">
          <Thread
            ref={threadRef}
            thread={thread}
            seen={chat?.seen}
            scrollThreadToBottom={scrollThreadToBottom}
          />
          <Separator />
          <div
            ref={inputContainer}
            className="relative w-full box-border flex-col p-5"
          >
            <PromptInput
              userInput={userInput}
              setUserInput={setUserInput}
              inputRef={inputRef}
              handleSendMessage={sendMessage}
              scrollToBottom={scrollThreadToBottom}
              hasJoined={hasJoined}
            />
            {!hasJoined && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm">
                <Button
                  onClick={async () => await joinChat()}
                  variant="default"
                  size="lg"
                >
                  Join the chat
                </Button>
              </div>
            )}
          </div>
          <ScrollToBottomButton
            isVisible={showScrollButton}
            onClick={scrollThreadToBottom}
            promptInputHeight={promptInputHeight}
          />

          <AnimatePresence mode="wait">
            {floatingDateState.show && floatingDateState.date && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none"
              >
                <DateSeparator date={floatingDateState.date} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnonSidebar anonUser={anonUser} sessionId={chat?.sessionId} />
      </div>
    </div>
  );
}

// todo - bring all the socket listeners here (main route)
// make sure to set the state correctly in the listener events

// update the "messages" event - to be "new message" - only send the new message instead of the whole thing

// +++++when do we send (widget)
// when we call handle submit (user message)
// when streamChat returns a chatbot message

// +++++on the main app
// when we call handle submit
// when an agent joins / leaves

// TODO -
// add typing indicator on widget side when agent is connected and typing
// add typing indicator on agent side for when chatbot is streaming response
//  - maybe stream the chatbot typing (with the same typing animation as widget end) so that the agent can see the entire convo happening
//  - when agent joins - it should be made clear how they will interrupt the chatbot (if it is typing something)
//      - maybe show a "stop generation" button on the agent side - in the textarea - like chatgpt
