import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import { getChatById, getMessagesByChatId } from "~/models/chat.server";
import { getChatbotById } from "~/models/chatbot.server";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Suspense } from "react";
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
import { Button } from "~/components/ui/button";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { prisma } from "~/db.server";

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

  return json({ messages, chatbot, chat, anonUser });
};

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();
  const { scrollRef } = useScrollToBottom();
  const { toast } = useToast();
  const isMobile = useMobileScreen();
  const navigate = useNavigate();
  const { chatbotId } = useParams();
  const [searchParams] = useSearchParams();

  function handleExitComplete() {
    navigate(`/chatbots/${chatbotId}/chats?${searchParams.toString()}`);
  }

  if (!data?.messages || !data?.chatbot) {
    return null;
  }

  return isMobile ? (
    <AnimatePresence onExitComplete={handleExitComplete}>
      <Modal title={`${data.chatbot.name} Chat`} onDismiss={handleExitComplete}>
        <div className="h-[80vh] overflow-y-auto p-4">
          <div className="space-y-5">
            {data.messages.map((message, i) => {
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
                                defaultShow={i >= data.messages.length - 6}
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
          <div className="text-md font-semibold">{data?.chat?.name}</div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(data?.chat?.createdAt), {
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
        <div className="flex flex-col col-span-7 overflow-y-auto h-full">
          <ScrollArea
            ref={scrollRef}
            className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-5"
          >
            <div className="space-y-5">
              {data.messages.map((message, i) => {
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
                                  defaultShow={i >= data.messages.length - 6}
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
          </ScrollArea>
        </div>
        <div className="flex flex-col col-span-3 overflow-y-auto h-full border-l p-5 gap-2">
          {data?.anonUser &&
            Object.keys(data.anonUser).map(
              (key) =>
                key !== "id" &&
                key !== "createdAt" &&
                key !== "updatedAt" &&
                key !== "sessionId" &&
                data.anonUser?.[key] &&
                key !== "ua" && (
                  <div
                    className="flex items-center justify-start gap-2 w-full"
                    key={key}
                  >
                    <p className="text-sm text-muted-foreground">{key}</p>
                    <small className="text-sm font-medium leading-none">
                      {data.anonUser?.[key]}
                    </small>
                  </div>
                ),
            )}
        </div>
      </div>
    </div>
  );
}
