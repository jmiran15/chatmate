import { createId } from "@paralleldrive/cuid2";
import { Prisma, TicketStatus } from "@prisma/client";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
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
import Thread from "./thread";
import useAgent from "./use-agent";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chat = await getChatInfo(chatsId);

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

      const nextChatId = await deleteChat({
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
      return await markChatAsSeen({ chatId });
    }
    case "create-label": {
      const name = String(formData.get("label-name"));
      const label = await createLabel({ name, chatbotId });
      return json({ label });
    }
    case "update-label": {
      const labelId = String(formData.get("label-id"));
      const name = String(formData.get("label-name"));
      const color = String(formData.get("label-color"));
      const label = await updateLabel({ labelId, name, color });
      return json({ label });
    }
    case "delete-label": {
      const labelId = String(formData.get("label-id"));
      const label = await deleteLabel({ labelId });
      return json({ label });
    }
    case "connect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await connectLabel({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "disconnect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await disconnectLabel({ chatId: chatsId, labelId });
      return json({ chat });
    }
    case "update-status": {
      const status = String(formData.get("status")) as TicketStatus;
      const chat = await updateChatStatus({ chatId: chatsId, status });
      return json({ chat });
    }
    default:
      throw new Error("undefined intent");
  }
};

export default function ChatRoute() {
  const { messages, chatbot, chat, anonUser, API_PATH } =
    useLoaderData<typeof loader>();
  const isMobile = useMobileScreen();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputContainer = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState(() => messages ?? []); // we can move this by just using Remix - action?
  const [userInput, setUserInput] = useState("");
  const {
    setAutoScroll,
    scrollRef: threadRef,
    scrollDomToBottom: scrollThreadToBottom,
  } = useScrollToBottom();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [promptInputHeight, setPromptInputHeight] = useState(
    () => inputContainer.current?.offsetHeight ?? 0,
  );
  const socket = useSocket();
  useAgent(chat?.sessionId);

  useEffect(() => {
    setThread(messages);
  }, [messages]);

  useEffect(() => {
    if (threadRef.current) {
      const { scrollHeight, clientHeight } = threadRef.current;
      setShowScrollButton(scrollHeight > clientHeight);
    }
  }, [threadRef.current?.scrollHeight, threadRef.current?.clientHeight]);

  async function handleSubmit(event: React.SyntheticEvent) {
    if (!socket) return;

    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const currentDate = new Date();
    const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    const newMessage = {
      id: createId(),
      content: userInput,
      role: "assistant",
      createdAt: formattedDate,
      updatedAt: formattedDate,
      chatId: chat.id,
      seen: false,
      clusterId: null,
    };

    const prevChatHistory = [...thread, newMessage];

    await axios.post(`${API_PATH}/api/chat/${chatbot?.id}/${chat?.sessionId}`, {
      chatbot,
      messages: prevChatHistory,
      chattingWithAgent: true,
    });

    setThread(prevChatHistory);
    setUserInput("");

    socket.emit("messages", {
      sessionId: chat?.sessionId,
      messages: prevChatHistory,
    });
  }

  const handleScroll = useCallback(() => {
    if (!threadRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100; // Show button when not at bottom
    setShowScrollButton(!atBottom);
  }, [threadRef.current]);

  useEffect(() => {
    const threadElement = threadRef.current;
    if (threadElement) {
      threadElement.addEventListener("scroll", handleScroll);
      return () => {
        threadElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    if (inputContainer.current) {
      setPromptInputHeight(inputContainer.current.offsetHeight);
    }
  }, [userInput]);

  return isMobile ? (
    <MobileThread
      thread={thread}
      setThread={setThread}
      chat={chat}
      chatbot={chatbot}
    />
  ) : (
    <div className="flex flex-col col-span-7 overflow-y-auto h-full">
      <Subheader chat={chat} />
      <div className="grid grid-cols-10 flex-1 overflow-y-auto">
        <div className="flex flex-col col-span-7 overflow-y-auto h-full relative w-full">
          <Thread
            ref={threadRef}
            thread={thread}
            setThread={setThread}
            sessionId={chat?.sessionId}
            seen={chat?.seen}
            scrollThreadToBottom={scrollThreadToBottom}
          />
          <Separator />
          <div
            ref={inputContainer}
            className="relative w-full box-border flex-col pt-2.5 p-5 space-y-2 "
          >
            <PromptInput
              userInput={userInput}
              setUserInput={setUserInput}
              inputRef={inputRef}
              handleSendMessage={handleSubmit}
              scrollToBottom={scrollThreadToBottom}
              setAutoScroll={setAutoScroll}
            />
          </div>
          <ScrollToBottomButton
            isVisible={showScrollButton}
            onClick={scrollThreadToBottom}
            promptInputHeight={promptInputHeight}
          />
        </div>
        <AnonSidebar anonUser={anonUser} sessionId={chat?.sessionId} />
      </div>
    </div>
  );
}
