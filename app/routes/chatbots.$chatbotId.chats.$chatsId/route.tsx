import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import { getChatById, getMessagesByChatId } from "~/models/chat.server";
import { getChatbotById } from "~/models/chatbot.server";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Suspense, useEffect, useRef, useState } from "react";
import { Loading } from "~/components/ui/loading";
import Markdown from "~/components/ui/markdown";
import { useScrollToBottom } from "~/hooks/useScroll";
import { format, formatDistanceToNow } from "date-fns";
import { ChatAction } from "~/components/chat/chat-action";
import { copyToClipboard } from "~/utils/clipboard";
import { Clipboard } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { useMobileScreen } from "~/utils/mobile";
import { AnimatePresence } from "framer-motion";
import Modal from "~/components/custom-mobile-modal";
// import { StarIcon } from "@heroicons/react/24/outline";
// import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { prisma } from "~/db.server";
import { Separator } from "~/components/ui/separator";

import PromptInput from "./prompt-input";
import AnonSidebar from "./anon-sidebar";
import Thread from "./thread";
import { useSocket } from "~/providers/socket";
import axios from "axios";

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

export default function ChatRoute() {
  const { messages, chatbot, chat, anonUser, API_PATH } =
    useLoaderData<typeof loader>();
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const { toast } = useToast();
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
        <div className="h-[80vh] overflow-y-auto p-4">
          <div className="space-y-5">
            {messages.map((message, i) => {
              const isUser = message.role === "user";
              const showActions = i > 0 && !(message.content.length === 0);

              return (
                <div className="space-y-5" key={i}>
                  <div
                    className={
                      isUser
                        ? "flex flex-row-reverse"
                        : "flex flex-row last:animate-[slide-in_ease_0.3s]"
                    }
                  >
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <div
                          className={cn(
                            "max-w-[80%] flex flex-col items-start",
                            isUser && "items-end",
                          )}
                        >
                          <div
                            className={cn(
                              "box-border max-w-full text-sm select-text relative break-words rounded-lg px-3 py-2",
                              isUser
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-muted",
                            )}
                          >
                            <Suspense fallback={<Loading />}>
                              <Markdown
                                content={message.content}
                                parentRef={scrollRef}
                                defaultShow={i >= messages.length - 6}
                              />
                            </Suspense>
                          </div>
                          <div className="text-xs text-muted-foreground opacity-80 whitespace-nowrap text-right w-full box-border pointer-events-none z-[1]">
                            {format(
                              new Date(message.createdAt),
                              "M/d/yyyy, h:mm:ss a",
                            )}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      {showActions ? (
                        <HoverCardContent
                          side="top"
                          align={isUser ? "end" : "start"}
                          className="py-1 px-0 w-fit"
                        >
                          <div className="flex items-center divide-x">
                            <>
                              <ChatAction
                                text={"Copy"}
                                icon={<Clipboard className="w-4 h-4" />}
                                onClick={() =>
                                  copyToClipboard(message.content, toast)
                                }
                              />
                            </>
                          </div>
                        </HoverCardContent>
                      ) : (
                        <></>
                      )}
                    </HoverCard>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  ) : (
    <div className="flex flex-col col-span-7 overflow-y-auto h-full">
      {/* a subheader here with more info */}
      <div className="flex justify-between items-center w-full h-14 border-b bg-muted/40 p-5">
        <div className="flex flex-col items-start justify-center">
          <div className="text-md font-semibold">{chat?.name}</div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(chat?.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div>
          {/* TODO - actions go here */}
          {/* <Button onClick={() => {}} variant="ghost" size="icon">
            {data?.chat?.starred ? (
              <StarIconSolid className="w-4 h-4" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
          </Button> */}
        </div>
      </div>
      {/* below it is a grid, with chats taking up most of it, and user info space taking up the rest */}

      <div className="grid grid-cols-10 flex-1 overflow-y-auto">
        <div className="flex flex-col col-span-7 overflow-y-auto h-full relative">
          <Thread
            thread={thread}
            setThread={setThread}
            sessionId={chat?.sessionId}
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
