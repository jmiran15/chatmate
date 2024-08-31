import { useLoaderData, useSubmit } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useScrollToBottom } from "~/hooks/useScroll";
import { useMobileScreen } from "~/utils/mobile";
import { action } from "./action.server";
import AnonSidebar from "./anon-sidebar";
import { loader } from "./loader.server";
import MobileThread from "./mobile-thread";
import PromptInput from "./prompt-input";
import ScrollToBottomButton from "./ScrollToBottomButton";
import Subheader from "./subheader";
import { DateSeparator } from "./thread/DateSeparator";
import Thread from "./thread/thread";
import useAgent from "./use-agent";
import useThread from "./useThread";

export { action, loader };

export default function ChatRoute() {
  const { messages, chatbot, chat, anonUser } = useLoaderData<typeof loader>();
  const { thread } = useThread({ loaderMessages: messages });
  const submit = useSubmit();
  const isMobile = useMobileScreen();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputContainer = useRef<HTMLDivElement>(null);
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
  const { hasJoined, joinChat } = useAgent({
    chatId: chat?.id,
    submit,
  });
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
              scrollToBottom={scrollThreadToBottom}
              hasJoined={hasJoined}
              submit={submit}
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

// TODO -
// add typing indicator on widget side when agent is connected and typing
// add typing indicator on agent side for when chatbot is streaming response
//  - maybe stream the chatbot typing (with the same typing animation as widget end) so that the agent can see the entire convo happening
//  - when agent joins - it should be made clear how they will interrupt the chatbot (if it is typing something)
//      - maybe show a "stop generation" button on the agent side - in the textarea - like chatgpt
