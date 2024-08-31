import { createId } from "@paralleldrive/cuid2";
import {
  useFetchers,
  useNavigation,
  useParams,
  useSubmit,
} from "@remix-run/react";
import { Textarea } from "@tremor/react";
import { Send } from "lucide-react";
import { DateTime } from "luxon";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Button } from "~/components/ui/button";
import { useSubmitHandler } from "~/hooks/useSubmit";
import { cn } from "~/lib/utils";
import { useSocket } from "~/providers/socket";
import { autoGrowTextArea } from "~/utils/autogrow";
import { useMobileScreen } from "~/utils/mobile";
import { SEND_INTENT } from "./useThread";

const MobileSendButton = React.memo(
  ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <Button size="icon" disabled={disabled} onClick={onClick}>
      <Send className="h-4 w-4" />
    </Button>
  ),
);

const PromptInput = React.memo(
  ({
    userInput,
    setUserInput,
    inputRef,
    scrollToBottom,
    hasJoined,
    submit,
  }: {
    userInput: string;
    setUserInput: (value: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    scrollToBottom: () => void;
    hasJoined: boolean;
    submit: ReturnType<typeof useSubmit>;
  }) => {
    const { shouldSubmit } = useSubmitHandler();
    const isMobileScreen = useMobileScreen();
    const autoFocus = !isMobileScreen;
    const socket = useSocket();
    const { chatsId: chatId } = useParams();
    const navigation = useNavigation();

    const lastMeasureTime = useRef(0);
    const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const measure = useCallback(() => {
      if (inputRef.current) {
        const now = Date.now();
        if (now - lastMeasureTime.current > 100) {
          const rows = autoGrowTextArea(inputRef.current);
          lastMeasureTime.current = now;
          return Math.min(20, Math.max(1 + Number(!isMobileScreen), rows));
        }
      }
      return null;
    }, [inputRef, isMobileScreen]);

    useLayoutEffect(() => {
      const measuredRows = measure();
      if (measuredRows !== null && inputRef.current) {
        inputRef.current.rows = measuredRows;
      }
    }, [userInput, measure]);

    const sendMessage = useCallback(
      ({ message, chatId }: { message: string; chatId: string }) => {
        if (!message || message.trim() === "") return false;
        const currentDate = DateTime.now();

        const newMessage = {
          id: createId(),
          content: message,
          role: "assistant",
          createdAt: currentDate,
          updatedAt: currentDate,
          chatId,
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
            navigate: false,
            fetcherKey: `input-send-message-${newMessage.id}`,
          },
        );

        setUserInput("");
      },
      [submit, setUserInput],
    );

    // TODO - do this stuff in the main route or thread?
    // get input fetchers
    const fetchers = useFetchers();
    const inputFetchers = fetchers.filter(
      (fetcher) =>
        fetcher.key?.startsWith("input-send-message") &&
        fetcher.data?.messageCreatedSuccessfully,
    );
    const agentFetchers = fetchers.filter(
      (fetcher) =>
        fetcher.key?.startsWith("agent-send-message") &&
        fetcher.data?.messageCreatedSuccessfully,
    );

    console.log("agentFetchers", agentFetchers);

    useEffect(() => {
      if (socket && agentFetchers.length > 0) {
        agentFetchers.forEach((fetcher) => {
          if (fetcher.data?.messageCreatedSuccessfully) {
            socket.emit("new message", {
              chatId,
              message: {
                ...fetcher.data.message,
                // convert all dates - these dates were stringified - they were initially generared via New Date(). Do not use DateTime.fromIso ... to actual dates
                createdAt: new Date(fetcher.data.message.createdAt),
                updatedAt: new Date(fetcher.data.message.updatedAt),
                seenByUserAt: new Date(fetcher.data.message.seenByUserAt),
              },
            });
          }
        });
      }
    }, [socket, agentFetchers.length, chatId]);

    useEffect(() => {
      if (socket && inputFetchers.length > 0) {
        inputFetchers.forEach((fetcher) => {
          if (fetcher.data?.messageCreatedSuccessfully) {
            socket.emit("new message", {
              chatId,
              message: {
                ...fetcher.data.message,
                // convert all dates to actual dates
                createdAt: new Date(fetcher.data.message.createdAt),
                updatedAt: new Date(fetcher.data.message.updatedAt),
                seenByUserAt: new Date(fetcher.data.message.seenByUserAt),
              },
            });
          }
        });
      }
    }, [socket, inputFetchers.length, chatId]);

    const onInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (shouldSubmit(e)) {
          sendMessage({
            message: userInput,
            chatId: chatId!,
          });
          e.preventDefault();
        }
      },
      [shouldSubmit, sendMessage, userInput, chatId],
    );

    const isInputEmpty = useMemo(() => userInput.trim() === "", [userInput]);

    useEffect(() => {
      if (navigation.state === "submitting") {
        const formData = navigation.formData;
        if (formData && formData.get("intent") === SEND_INTENT) {
          setUserInput("");
        }
      }
    }, [navigation.state, navigation.formData]);

    useEffect(() => {
      return () => {
        if (measureTimeoutRef.current) {
          clearTimeout(measureTimeoutRef.current);
        }
      };
    }, []);

    if (!chatId) return null;

    return (
      <div className="flex flex-1 items-end relative">
        <Textarea
          className={cn(
            "ring-inset focus-visible:ring-offset-0 pr-28 md:pr-40 min-h-[56px]",
            !hasJoined && "pointer-events-none",
          )}
          ref={inputRef}
          placeholder={
            isMobileScreen
              ? "Enter to send"
              : "Enter to send, Shift + Enter to wrap"
          }
          {...(hasJoined
            ? {
                onFocus: scrollToBottom,
                onClick: scrollToBottom,
                onKeyDown: onInputKeyDown,
                value: userInput,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setUserInput(e.target.value);
                  measureTimeoutRef.current = setTimeout(measure, 0);
                },
                autoFocus: autoFocus,
              }
            : {})}
        />

        <div className="my-2 flex items-center gap-2.5 absolute right-[15px]">
          {isMobileScreen ? (
            <MobileSendButton
              disabled={isInputEmpty || !hasJoined}
              onClick={() => sendMessage({ message: userInput, chatId })}
            />
          ) : (
            <Button
              onClick={() => sendMessage({ message: userInput, chatId })}
              disabled={isInputEmpty || !hasJoined}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
        </div>
      </div>
    );
  },
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
