import { useCallback, useEffect } from "react";
import { useSocket } from "~/providers/socket";

export default function useAgent(chatId: string | null): {
  joinChat: () => void;
} {
  const socket = useSocket();

  const joinChat = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit("isAgent", { chatId, isAgent: true });
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const handlePollingIsAgent = (data: { chatId: string }) => {
      if (chatId === data.chatId) {
        socket.emit("isAgent", { ...data, isAgent: true });
      }
    };

    console.log("connecting agent");
    socket.on("pollingAgent", handlePollingIsAgent);

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
      socket.emit("isAgent", { chatId, isAgent: false });
    };
  }, [socket, chatId]);

  return { joinChat };
}
