import { createId } from "@paralleldrive/cuid2";
import { type ActivityType } from "@prisma/client";
import { useSubmit } from "@remix-run/react";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { useSocket } from "~/providers/socket";

interface UseAgentParams {
  chatId: string | null;
  submit: ReturnType<typeof useSubmit>;
}

export default function useAgent({ chatId, submit }: UseAgentParams): {
  joinChat: () => void;
  leaveChat: () => void;
  hasJoined: boolean;
} {
  const socket = useSocket();
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    hasJoinedRef.current = false;
    return () => {
      if (chatId) {
        // TODO - call a backrgound cron job that automatically leaves the chat after X minutes (in case for some reason the leaveChat failed or did get called)
        leaveChat();
      }
    };
  }, [chatId]);

  const sendActivityMessage = (activity: ActivityType, content: string) => {
    // const formattedDate = DateTime.now().toISO();
    const currentDate = DateTime.now();
    const newMessage = {
      id: createId(),
      content,
      role: "assistant",
      createdAt: currentDate,
      updatedAt: currentDate,
      chatId,
      seenByUser: false,
      seenByAgent: true,
      activity,
    };

    submit(
      {
        intent: "createMessage",
        message: JSON.stringify(newMessage),
      },
      {
        method: "POST",
        navigate: false,
        fetcherKey: `agent-send-message-${newMessage.id}`,
      },
    );

    // if (socket) {
    //   socket.emit("new message", {
    //     chatId,
    //     message: newMessage,
    //   });
    // }
  };

  const joinChat = async () => {
    if (!socket || !chatId || hasJoinedRef.current) return;

    submit(
      {
        intent: "notifyUserAgentJoined",
        chatId,
      },
      {
        method: "POST",
        navigate: false,
        fetcherKey: `agent-notify-user-agent-joined-${chatId}`,
      },
    );

    socket.emit("isAgent", { chatId, isAgent: true });
    sendActivityMessage("AGENT_JOINED", "Agent has joined the chat");
    hasJoinedRef.current = true;
  };

  const leaveChat = () => {
    console.log("Leaving chat:", chatId, "hasJoined:", hasJoinedRef.current);
    if (!socket || !chatId || !hasJoinedRef.current) return;
    socket.emit("isAgent", { chatId, isAgent: false });
    sendActivityMessage("AGENT_LEFT", "Agent has left the chat");
    hasJoinedRef.current = false;
  };

  useEffect(() => {
    if (!socket || !chatId) return;

    const handlePollingIsAgent = (data: { chatId: string }) => {
      if (chatId === data.chatId) {
        socket.emit("isAgent", { ...data, isAgent: hasJoinedRef.current });
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
    };
  }, [socket, chatId]);

  return { joinChat, leaveChat, hasJoined: hasJoinedRef.current };
}
