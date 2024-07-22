import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import { getChatById, getMessagesByChatId } from "~/models/chat.server";
import { getChatbotById } from "~/models/chatbot.server";
import { useEffect, useRef, useState } from "react";
import { useScrollToBottom } from "~/hooks/useScroll";
import { format } from "date-fns";
import { useMobileScreen } from "~/utils/mobile";
import { AnimatePresence } from "framer-motion";
import Modal from "~/components/custom-mobile-modal";
import { prisma } from "~/db.server";
import { Separator } from "~/components/ui/separator";
import PromptInput from "./prompt-input";
import AnonSidebar from "./anon-sidebar";
import Thread from "./thread";
import { useSocket } from "~/providers/socket";
import axios from "axios";
import Subheader from "./subheader";
import { Prisma } from "@prisma/client";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  // if is mobile, wrap in Modal, o/w wrap in grid col span stuff

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const [messages, chatbot, chat] = await Promise.all([
    getMessagesByChatId({ chatId: chatsId }),
    getChatbotById({ id: chatbotId }),
    getChatById({ chatId: chatsId }),
  ]);

  if (!chat) {
    throw new Error("Chat not found");
  }

  const anonUser =
    chat.sessionId &&
    (await prisma.anonymousUser.findUnique({
      where: {
        sessionId: chat.sessionId,
      },
    }));

  const API_PATH =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_BASE
      : process.env.PROD_BASE;
  return json({ messages, chatbot, chat, anonUser, API_PATH });
};

const getStarred = (searchParams: URLSearchParams): "1" | "0" =>
  String(searchParams.get("starred")) === "1" ? "1" : "0";

export const getCreatedAt = (searchParams: URLSearchParams): "asc" | "desc" =>
  String(searchParams.get("createdAt")) === "asc" ? "asc" : "desc";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const { chatbotId } = params;
  const { searchParams } = new URL(request.url);

  if (!chatbotId) {
    throw new Error("Chatbot id missing");
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

      const WHERE = {
        chatbotId,
        ...starredQuery,
        userId: null,
        deleted: false,
        messages: {
          some: {
            role: "user",
          },
        },
      };

      const nextChat = await prisma.chat.findFirst({
        where: WHERE,
        cursor: {
          id: chatId,
        },
        skip: 1,
        orderBy: {
          ...createdAtQuery,
        },
      });

      const nextChatId = nextChat ? nextChat.id : null;

      await prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          deleted: true,
        },
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
      return await prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          seen: true,
        },
      });
    }
    default:
      throw new Error("undefined intent");
  }
};

export default function ChatRoute() {
  const { messages, chatbot, chat, anonUser, API_PATH } =
    useLoaderData<typeof loader>();
  const { setAutoScroll, scrollDomToBottom } = useScrollToBottom();

  const isMobile = useMobileScreen();
  const navigate = useNavigate();
  const { chatbotId } = useParams();
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [thread, setThread] = useState(() => messages ?? []); // we can move this by just using Remix - action?
  const [userInput, setUserInput] = useState("");
  const socket = useSocket();

  useAgent(chat?.sessionId);

  function handleExitComplete() {
    navigate(`/chatbots/${chatbotId}/chats?${searchParams.toString()}`);
  }

  useEffect(() => {
    setThread(messages);
  }, [messages]);

  if (!messages || !chatbot || !chat) {
    return null;
  }

  async function handleSubmit(event) {
    if (!socket) return;

    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const currentDate = new Date();
    const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    const prevChatHistory = [
      ...thread,
      { content: userInput, role: "assistant", createdAt: formattedDate },
    ];

    // need to create in db
    await axios.post(`${API_PATH}/api/chat/${chatbot?.id}/${chat?.sessionId}`, {
      chatbot,
      messages: prevChatHistory,
      chattingWithAgent: true,
    });

    setThread(prevChatHistory);
    setUserInput("");

    console.log("emitting; ", {
      sessionId: chat?.sessionId,
      messages: prevChatHistory,
    });

    socket.emit("messages", {
      sessionId: chat?.sessionId,
      messages: prevChatHistory,
    });
  }

  return isMobile ? (
    <AnimatePresence onExitComplete={handleExitComplete}>
      <Modal title={`${chatbot.name} Chat`} onDismiss={handleExitComplete}>
        <div className="h-[80vh] overflow-y-auto">
          <Thread
            thread={thread}
            setThread={setThread}
            sessionId={chat?.sessionId}
            seen={chat?.seen}
          />
        </div>
      </Modal>
    </AnimatePresence>
  ) : (
    <div className="flex flex-col col-span-7 overflow-y-auto h-full">
      {/* a subheader here with more info */}
      <Subheader chat={chat} />
      {/* below it is a grid, with chats taking up most of it, and user info space taking up the rest */}

      <div className="grid grid-cols-10 flex-1 overflow-y-auto">
        <div className="flex flex-col col-span-7 overflow-y-auto h-full relative">
          <Thread
            thread={thread}
            setThread={setThread}
            sessionId={chat?.sessionId}
            seen={chat?.seen}
          />
          <Separator />
          <div className="relative w-full box-border flex-col pt-2.5 p-5 space-y-2 ">
            <PromptInput
              userInput={userInput}
              setUserInput={setUserInput}
              inputRef={inputRef}
              handleSendMessage={handleSubmit}
              scrollToBottom={scrollDomToBottom}
              setAutoScroll={setAutoScroll}
            />
          </div>
        </div>
        <div className="flex flex-col col-span-3 overflow-y-auto h-full border-l p-5 gap-2">
          <AnonSidebar anonUser={anonUser} sessionId={chat?.sessionId} />
        </div>
      </div>
    </div>
  );
}

function useAgent(sessionId: string | null): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handlePollingIsAgent = (data: { sessionId: string }) => {
      if (sessionId === data.sessionId) {
        console.log(`${socket.id} - isAgent: `, { ...data, isAgent: true });
        socket.emit("isAgent", { ...data, isAgent: true });
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);
    console.log(`${socket.id} - isAgent: `, { sessionId, isAgent: true });
    socket.emit("isAgent", { sessionId, isAgent: true });

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
      console.log(`${socket.id} - isAgent: `, { sessionId, isAgent: false });
      socket.emit("isAgent", { sessionId, isAgent: false });
    };
  }, [socket, sessionId]);
}
