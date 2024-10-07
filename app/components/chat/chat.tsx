import { fetchEventSource } from "@microsoft/fetch-event-source";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import ChatInput from "./chat-input";

import { createId } from "@paralleldrive/cuid2";
import { Form, FormSubmission } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import axios from "axios";
import { Check, Clipboard } from "lucide-react";
import { Suspense, lazy, useMemo, useRef } from "react";
import { z } from "zod";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useScrollToBottom } from "~/hooks/useScroll";
import { cn } from "~/lib/utils";
import { useSocket } from "~/providers/socket";
import { loader } from "~/routes/chatbots.$chatbotId.chat.$chatId/route";
import { useAutoForm } from "~/routes/chatbots.$chatbotId.forms.$formId/useAutoForm";
import { copyToClipboard } from "~/utils/clipboard";
import { useMobileScreen } from "~/utils/mobile";
import AutoForm, { AutoFormSubmit } from "../ui/auto-form";
import { Button } from "../ui/button";
import { Loading } from "../ui/loading";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { ChatAction } from "./chat-action";

// replace this with the new PreviewMarkdown component that uses mdx.js
const Markdown = lazy(() => import("../ui/markdown"));

interface SSEMessage {
  id: string;
  type: "textResponseChunk" | "abort";
  textResponse: string | null;
  error: string | null;
  streaming: boolean;
}

export const CHAT_PAGE_SIZE = 15;

export default function Chat() {
  const data = useLoaderData<typeof loader>();
  const [loading, setLoading] = useState<boolean>(true);
  const [userInput, setUserInput] = useState(() => data?.userMessage ?? "");
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const { chatId, chatbotId } = useParams();
  const [chatbot, setChatbot] = useState(() => data?.chatbot);
  const [BASE_URL, setBASE_URL] = useState(() => data?.BASE_URL);
  const [messages, setMessages] = useState<
    ({ role: "user" | "assistant"; content: string } & {
      id: string;
      createdAt: string;
      streaming: boolean;
      isFormMessage: boolean;
      form: SerializeFrom<Form | null>;
      formSubmission: SerializeFrom<FormSubmission | null>;
    })[]
  >(
    () =>
      data?.messages?.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
        streaming: false,
        isFormMessage: msg.isFormMessage ?? false,
        form: msg.form ?? null,
        formSubmission: msg.formSubmission ?? null,
      })) ?? [],
  );
  const [_, setSearchParams] = useSearchParams();

  const [followUps, setFollowUps] = useState<string[]>([]);
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, messages.length - CHAT_PAGE_SIZE),
  );
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    setMessages(
      data?.messages?.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt,
        streaming: false,
        isFormMessage: msg.isFormMessage ?? false,
        form: msg.form ?? null,
        formSubmission: msg.formSubmission ?? null,
      })) ?? [],
    );
    setChatbot(data?.chatbot);
    setBASE_URL(data?.BASE_URL);

    const showInitalStarterQuestions =
      data?.messages?.length <= (data?.chatbot?.introMessages?.length || 0);

    if (showInitalStarterQuestions) {
      setFollowUps(data?.chatbot?.starterQuestions || []);
    } else {
      setFollowUps([]);
    }

    // example queries
    if (data?.userMessage) {
      handleSubmit({ preventDefault: () => {} } as any);
      setSearchParams((prev) => {
        prev.delete("userMessage");
        return prev;
      });
    }

    console.log(
      "showInitalStarterQuestions",
      data?.chat?.hasLoadedInitialMessages,
      showInitalStarterQuestions,
      chatId,
      chatbotId,
    );
    if (
      !data?.chat?.hasLoadedInitialMessages &&
      showInitalStarterQuestions &&
      chatId &&
      chatbotId
    ) {
      axios
        .post(`${BASE_URL}/api/initialload/${chatId}/${chatbotId}`)
        .then((res) => {
          console.log(res.data);
          const { chat } = res.data;
        })
        .catch((error) => {
          setMessages([]);
          setLoading(false);
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", error.message);
          }
          console.log(error.config);
        });
    }
  }, [chatId, chatbotId, BASE_URL, data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userInput || userInput === "") return false;

    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    const prevChatHistory = [
      ...messages,
      {
        id: createId(),
        content: userInput,
        role: "user" as "user",
        createdAt: String(currentDate),
        streaming: false,
        isFormMessage: false,
        form: null,
        formSubmission: null,
      },
      {
        id: createId(),
        content: "",
        role: "assistant" as "assistant",
        createdAt: String(currentDate),
        streaming: true,
        isFormMessage: false,
        form: null,
        formSubmission: null,
      },
    ];

    setLoading(true);
    setMessages(prevChatHistory);
    setUserInput("");
    setFollowUps([]);

    return await streamChat({
      message: userInput,
    });
  };

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(messages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const msgs = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      messages.length,
    );
    return messages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, messages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom = bottomHeight >= e.scrollHeight - 10;

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(messages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  const streamChat = async ({
    message,
  }: {
    message: string;
  }): Promise<void> => {
    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    const _messages = [
      ...messages,
      {
        id: createId(),
        content: message,
        role: "user" as "user",
        createdAt: String(currentDate),
        streaming: false,
      },
    ];
    setFollowUps([]);

    const ctrl = new AbortController();

    await fetchEventSource(`${BASE_URL}/api/chat/${chatbotId}/${chatId}`, {
      method: "POST",
      body: JSON.stringify({
        messages: [
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          {
            role: "user",
            content: message,
          },
        ],
        chattingWithAgent: false,
        chatId: true,
      }),
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          return;
        } else if (response.status >= 400) {
          await response
            .json()
            .then((serverResponse) => {
              handleChat({
                sseMessage: serverResponse,
                _messages,
              });
            })
            .catch(() => {
              handleChat({
                sseMessage: {
                  id: createId(),
                  type: "abort",
                  textResponse: null,
                  streaming: false,
                  error: `An error occurred while streaming response. Code ${response.status}`,
                },
                _messages,
              });
            });
          ctrl.abort();
          throw new Error();
        } else {
          await handleChat({
            sseMessage: {
              id: createId(),
              type: "abort",
              textResponse: null,
              streaming: false,
              error: `An error occurred while streaming response. Unknown Error.`,
            },
            _messages,
          });
          ctrl.abort();
          throw new Error("Unknown Error");
        }
      },
      async onmessage(msg) {
        try {
          const sseMessage = JSON.parse(msg.data);
          await handleChat({
            sseMessage,
            _messages,
          });
        } catch {}
      },
      onerror(err) {
        handleChat({
          sseMessage: {
            id: createId(),
            type: "abort",
            textResponse: null,
            streaming: false,
            error: `An error occurred while streaming response. ${err.message}`,
          },
          _messages,
        });
        ctrl.abort();
        throw new Error();
      },
    });
  };

  async function handleChat({
    sseMessage,
    _messages,
  }: {
    sseMessage: SSEMessage;
    _messages: any[];
  }) {
    const { id, textResponse, type, error, streaming } = sseMessage;
    const currentDate = new Date();
    // const formattedDate = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    setLoading(false);

    switch (type) {
      case "abort": {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id,
            content: "",
            error: error ?? undefined,
            role: "assistant" as "assistant",
            createdAt: String(currentDate),
            streaming,
            loading: false,
            isFormMessage: false,
            form: null,
            formSubmission: null,
          },
        ]);
        break;
      }
      case "textResponseChunk": {
        const chatIdx = _messages.findIndex((chat) => chat.id === id);

        if (chatIdx !== -1) {
          const existingMessage = { ..._messages[chatIdx] };
          const updatedMessage = {
            ...existingMessage,
            content: (existingMessage.content ?? "") + (textResponse ?? ""),
            streaming,
          };
          _messages[chatIdx] = updatedMessage;
        } else {
          _messages.push({
            id,
            content: textResponse ?? "",
            role: "assistant" as "assistant",
            createdAt: String(currentDate),
            streaming,
            error: undefined,
            loading: false,
          });
        }

        setMessages([..._messages]);
        if (!streaming) {
          await generateFollowUps({ messages: _messages });
        }
        break;
      }
      default:
        break;
    }
  }

  async function generateFollowUps({ messages }: { messages: any[] }) {
    const followUpRes = await fetch(`${BASE_URL}/api/generatefollowups`, {
      method: "POST",
      body: JSON.stringify({
        history: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    const { followUps } = await followUpRes.json();
    return setFollowUps(followUps);
  }

  // add agent typing and new message events to the socket manager

  const { addMessageToQueue } = useMessageProcessor({
    setMessages,
    setFollowUps,
    messages,
  });
  const handleThread = useCallback(
    (data: { chatId: string; message: any }) => {
      if (chatId === data.chatId) {
        addMessageToQueue(data.message);
        // setMessages((prevThread) => {
        //   const newMessage = data.message;

        //   return [...prevThread, newMessage];
        // });
      }
    },
    [chatId, setMessages],
  );

  const handleAgentTyping = useCallback(
    (data: any) => {
      if (chatId !== data.chatId) return;

      setMessages((prevThread) => {
        const lastMessage = prevThread[prevThread.length - 1];
        const isTypingMessage =
          lastMessage?.role === "assistant" && lastMessage?.streaming;

        if (isTypingMessage && data.isTyping) {
          setLoading(true);
          return prevThread; // No change needed
        } else if (isTypingMessage && !data.isTyping) {
          setLoading(false);
          return prevThread.slice(0, -1);
        } else if (!isTypingMessage && data.isTyping) {
          setLoading(true);
          return [
            ...prevThread,
            {
              id: `preview-${Date.now()}`,
              role: "assistant",
              createdAt: String(new Date()),
              content: "",
              streaming: true,
              isFormMessage: false,
              form: null,
              formSubmission: null,
            },
          ];
        } else {
          return prevThread;
        }
      });
    },
    [chatId, setMessages, setLoading],
  );

  const socket = useSocket();

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.on("agent typing", handleAgentTyping);
    socket.on("new message", handleThread);

    return () => {
      socket.off("agent typing", handleAgentTyping);
      socket.off("new message", handleThread);
    };

    // maybe we need to put thread as a dependency here?
  }, [socket, chatId, handleAgentTyping, handleThread]);

  return (
    <div className="flex flex-col relative h-full">
      <ScrollArea
        ref={scrollRef}
        className="flex-1 overflow-auto overflow-x-hidden relative overscroll-none pb-10 p-4"
        onMouseDown={() => inputRef.current?.blur()}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        <div className="space-y-5">
          {msgs.map((message, i) => {
            const isUser = message.role === "user";
            const showActions = i > 0;

            const messageContent = () => {
              if (loading && !isUser && message.streaming) {
                return <Loading />;
              }
              if (message.isFormMessage) {
                return (
                  <FormMessage
                    BASE_URL={BASE_URL}
                    message={message}
                    setMessages={setMessages}
                  />
                );
              } else {
                return (
                  <Suspense fallback={<Loading />}>
                    <Markdown
                      content={message.content}
                      onDoubleClickCapture={() => {
                        if (!isMobileScreen) return;
                        setUserInput(message.content);
                      }}
                      parentRef={scrollRef}
                      defaultShow={i >= msgs.length - 6}
                    />
                  </Suspense>
                );
              }
            };

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
                          {messageContent()}
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

          <div className="space-y-2">
            {followUps.length > 0 ? (
              followUps.map((followUp, i) => (
                <form key={i} onSubmit={handleSubmit}>
                  <Button
                    variant={"outline"}
                    type="submit"
                    className="max-w-[80%] flex items-end text-sm select-text relative break-words rounded-lg px-3 py-2 ml-auto"
                    onClick={() => {
                      setUserInput(followUp);
                    }}
                  >
                    {followUp}
                  </Button>
                </form>
              ))
            ) : (
              <></>
            )}
          </div>
        </div>
      </ScrollArea>
      <Separator />
      <div className="relative w-full box-border flex-col pt-2.5 p-5 space-y-2 ">
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          inputRef={inputRef}
          handleSendMessage={handleSubmit}
          scrollToBottom={scrollToBottom}
          setAutoScroll={setAutoScroll}
        />
      </div>
    </div>
  );
}

function FormSubmissionMessage() {
  return (
    <div className="flex flex-col items-start space-y-3">
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="bg-blue-100 rounded-full p-1">
          <Check className="w-5 h-5 text-blue-500" />
        </div>
        <span className="whitespace-normal flex flex-col gap-y-1 text-[14px] leading-[1.4] min-h-[10px] font-medium">
          Thank you for your submission!
        </span>
      </motion.div>
    </div>
  );
}

function FormMessage({
  BASE_URL,
  message,
  setMessages,
}: {
  BASE_URL: string | undefined;
  message: any;
  setMessages: any;
}) {
  const { formSchema, fieldConfig } = useAutoForm(message.form?.elements);
  if (message.formSubmission) {
    return <FormSubmissionMessage />;
  }

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      console.log("message\n", message);
      const validatedData = formSchema.parse(data);

      // lets call the route /api/form-submission with axios as POSt with the data as json body
      axios
        .post(`${BASE_URL}/api/form-submission`, {
          flowId: message.flowId,
          formId: message.form?.id,
          messageId: message.id,
          submissionData: validatedData,
          chatId: message.chatId,
        })
        .then((response) => {
          const updatedMessage = response.data?.updatedMessage;
          // update the state with the submission
          // we need to setMessages after the submission to update it
          setMessages((messages: any) =>
            messages.map((msg: any) =>
              msg.id === updatedMessage.id
                ? {
                    id: updatedMessage.id,
                    role: updatedMessage.role,
                    content: updatedMessage.content,
                    createdAt: updatedMessage.createdAt,
                    streaming: updatedMessage.streaming,
                    isFormMessage: updatedMessage.isFormMessage,
                    form: updatedMessage.form,
                    formSubmission: updatedMessage.formSubmission,
                  }
                : msg,
            ),
          );
        })
        .catch(function (error) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", error.message);
          }
          console.log(error.config);
        });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Form submitted with errors:", error.errors);
      }
    }
  };

  return (
    <AutoForm
      formSchema={formSchema}
      fieldConfig={fieldConfig}
      onSubmit={handleSubmit}
    >
      <AutoFormSubmit>Submit</AutoFormSubmit>
    </AutoForm>
  );
}

interface UseMessageProcessorProps {
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setFollowUps: React.Dispatch<React.SetStateAction<any[]>>;
  messages: any[];
}

export function useMessageProcessor({
  setMessages,
  setFollowUps,
  messages,
}: UseMessageProcessorProps) {
  const messageQueueRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);

  const processQueue = useCallback(() => {
    isProcessingRef.current = true;
    const addMessageToState = ({ message }: { message: any }) => {
      console.log("addMessageToState\n", message);
      setMessages((prevThread) => {
        const newMessageTime = new Date(message.createdAt).getTime();

        // Check if the message already exists
        const existingIndex = prevThread.findIndex((m) => m.id === message.id);
        if (existingIndex !== -1) {
          // Update existing message
          const updatedThread = [...prevThread];
          updatedThread[existingIndex] = {
            ...updatedThread[existingIndex],
            ...message,
            seenByAgent: updatedThread[existingIndex].seenByAgent,
            seenByUser: updatedThread[existingIndex].seenByUser,
            seenByUserAt:
              updatedThread[existingIndex].seenByUserAt || message.seenByUserAt,
            createdAt: updatedThread[existingIndex].createdAt,
            updatedAt: new Date(message.updatedAt),
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
        updatedThread.splice(insertIndex, 0, {
          ...message,
          createdAt: new Date(message.createdAt),
          updatedAt: new Date(message.updatedAt),
        });
        return updatedThread;
      });
    };

    const message = messageQueueRef.current.shift();
    if (!message) return;

    addMessageToState({
      message: {
        ...message,
        createdAt: new Date(message.createdAt),
        updatedAt: new Date(message.updatedAt),
      },
    });

    if (message.delay) {
      console.log("Setting timeout");
      setTimeout(() => {
        addMessageToState({
          message: {
            ...message,
            delay: undefined,
            loading: false,
            streaming: false,
          },
        });
        isProcessingRef.current = false;
      }, message.delay * 1000);
    } else {
      isProcessingRef.current = false;
    }

    setFollowUps([]);
  }, [setMessages, setFollowUps]);

  useEffect(() => {
    if (messageQueueRef.current.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [messages, processQueue]);

  const addMessageToQueue = (newMessage: any) => {
    console.log("newMessage", newMessage);
    messageQueueRef.current.push(newMessage);
    // processQueue();
    if (messageQueueRef.current.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  };

  return {
    addMessageToQueue,
  };
}
