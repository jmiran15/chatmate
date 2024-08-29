import { createId } from "@paralleldrive/cuid2";
import { type ActivityType } from "@prisma/client";
import axios from "axios";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import { useSocket } from "~/providers/socket";

interface UseAgentParams {
  chatId: string | null;
  chatbotId: string | null;
  API_PATH: string | undefined;
  setThread: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function useAgent({
  chatId,
  chatbotId,
  API_PATH,
  setThread,
}: UseAgentParams): {
  joinChat: () => Promise<void>;
  leaveChat: () => Promise<void>;
  hasJoined: boolean;
} {
  const socket = useSocket();
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    hasJoinedRef.current = false;
    return () => {
      if (!hasJoinedRef.current || !chatId || !chatbotId) return;
      const formattedDate = DateTime.now().toISO();
      const newMessage = {
        id: createId(),
        role: "assistant",
        content: "Agent has left the chat",
        createdAt: formattedDate,
        updatedAt: formattedDate,
        chatId,
        seenByUser: false,
        seenByAgent: true,
        clusterId: null,
        activity: "AGENT_LEFT",
      };

      axios
        .post(`${API_PATH}/api/chat/${chatbotId}/${chatId}`, {
          messages: [newMessage],
          chattingWithAgent: true,
          chatId: true,
        })
        .then(() => {
          socket?.emit("messages", {
            chatId,
            messages: [newMessage],
          });
        });
    };
  }, [chatId]);

  const sendActivityMessage = async (
    activity: ActivityType,
    content: string,
  ) => {
    if (!socket || !chatId || !chatbotId) return;

    const formattedDate = DateTime.now().toISO();
    const newMessage = {
      id: createId(),
      content,
      role: "assistant",
      createdAt: formattedDate,
      updatedAt: formattedDate,
      chatId,
      seenByUser: false,
      seenByAgent: true,
      clusterId: null,
      activity,
    };

    await axios.post(`${API_PATH}/api/chat/${chatbotId}/${chatId}`, {
      messages: [newMessage],
      chattingWithAgent: true,
      chatId: true,
    });

    setThread((prevThread) => {
      console.log("setThread: ", [...prevThread, newMessage]);
      return [...prevThread, newMessage];
    });

    socket.emit("messages", {
      chatId,
      messages: [newMessage],
    });
  };

  const joinChat = async () => {
    if (!socket || !chatId || hasJoinedRef.current) return;
    socket.emit("isAgent", { chatId, isAgent: true });
    await sendActivityMessage("AGENT_JOINED", "Agent has joined the chat");
    hasJoinedRef.current = true;
  };

  const leaveChat = async () => {
    if (!socket || !chatId || !hasJoinedRef.current) return;
    socket.emit("isAgent", { chatId, isAgent: false });
    await sendActivityMessage("AGENT_LEFT", "Agent has left the chat");
    hasJoinedRef.current = false;
  };

  useEffect(() => {
    if (!socket || !chatId) return;

    const handlePollingIsAgent = (data: { chatId: string }) => {
      if (chatId === data.chatId) {
        socket.emit("isAgent", { ...data, isAgent: true });
        hasJoinedRef.current = true;
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
    };
  }, [socket, chatId]);

  return { joinChat, leaveChat, hasJoined: hasJoinedRef.current };
}
