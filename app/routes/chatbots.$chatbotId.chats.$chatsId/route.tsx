import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useScrollToBottom } from "~/hooks/useScroll";
import { format } from "date-fns";
import { useMobileScreen } from "~/utils/mobile";
import { prisma } from "~/db.server";
import { Separator } from "~/components/ui/separator";
import PromptInput from "./prompt-input";
import AnonSidebar from "./anon-sidebar";
import Thread from "./thread";
import { useSocket } from "~/providers/socket";
import axios from "axios";
import Subheader from "./subheader";
import { Prisma, TicketStatus } from "@prisma/client";
import useAgent from "./use-agent";
import {
  deleteChat,
  getChatInfo,
  markChatAsSeen,
  createLabel,
  updateLabel,
  deleteLabel,
  connectLabel,
  disconnectLabel,
  updateChatStatus,
} from "./queries.server";
import { createId } from "@paralleldrive/cuid2";
import MobileThread from "./mobile-thread";

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
      return await markChatAsSeen(chatId);
    }
    case "create-label": {
      const name = String(formData.get("label-name"));
      const label = await createLabel(name, chatbotId);
      return json({ label });
    }
    case "update-label": {
      const labelId = String(formData.get("label-id"));
      const name = String(formData.get("label-name"));
      const color = String(formData.get("label-color"));
      const label = await updateLabel(labelId, name, color);
      return json({ label });
    }
    case "delete-label": {
      const labelId = String(formData.get("label-id"));
      const label = await deleteLabel(labelId);
      return json({ label });
    }
    case "connect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await connectLabel(chatsId, labelId);
      return json({ chat });
    }
    case "disconnect-label": {
      const labelId = String(formData.get("label-id"));
      const chat = await disconnectLabel(chatsId, labelId);
      return json({ chat });
    }
    case "update-status": {
      const status = String(formData.get("status")) as TicketStatus;
      const chat = await updateChatStatus(chatsId, status);
      return json({ chat });
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [thread, setThread] = useState(() => messages ?? []); // we can move this by just using Remix - action?
  const [userInput, setUserInput] = useState("");
  const socket = useSocket();
  useAgent(chat?.sessionId);

  useEffect(() => {
    setThread(messages);
  }, [messages]);

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
        <AnonSidebar anonUser={anonUser} sessionId={chat?.sessionId} />
      </div>
    </div>
  );
}
