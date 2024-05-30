import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { getMessagesByChatId } from "~/models/chat.server";
import { getChatbotById } from "~/models/chatbot.server";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Suspense, useState } from "react";
import { Loading } from "~/components/ui/loading";
import Markdown from "~/components/ui/markdown";
import { useScrollToBottom } from "~/hooks/useScroll";
import { format } from "date-fns";
import { ChatAction } from "~/components/chat/chat-action";
import { copyToClipboard } from "~/utils/clipboard";
import { Clipboard } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { useMobileScreen } from "~/utils/mobile";
import { AnimatePresence } from "framer-motion";
import Modal from "~/components/custom-mobile-modal";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatsId, chatbotId } = params;

  // if is mobile, wrap in Modal, o/w wrap in grid col span stuff

  if (!chatsId) {
    throw new Error("chatId is required");
  }

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const [messages, chatbot] = await Promise.all([
    getMessagesByChatId({ chatId: chatsId }),
    getChatbotById({ id: chatbotId }),
  ]);

  return json({ messages, chatbot });
};

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();
  const { scrollRef } = useScrollToBottom();
  const { toast } = useToast();
  const isMobile = useMobileScreen();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();
  const { chatbotId } = useParams();

  function handleDismiss() {
    setIsModalOpen(false);
  }

  function handleExitComplete() {
    navigate(`/chatbots/${chatbotId}/chats`, { replace: true });
  }

  if (!data?.messages || !data?.chatbot) {
    return null;
  }

  return isMobile ? (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isModalOpen && (
        <Modal title={`${data.chatbot.name} Chat`} onDismiss={handleDismiss}>
          <div className="max-h-[80vh] overflow-y-auto p-4">
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
      )}
    </AnimatePresence>
  ) : (
    <div className="hidden sm:flex flex-col col-span-7 overflow-y-auto h-full">
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
  );
}
