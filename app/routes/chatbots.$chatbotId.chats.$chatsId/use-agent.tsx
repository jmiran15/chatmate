import { useEffect } from "react";
import { useSocket } from "~/providers/socket";

export default function useAgent(chatId: string | null): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !chatId) return;

    const handlePollingIsAgent = (data: { chatId: string }) => {
      if (chatId === data.chatId) {
        socket.emit("isAgent", { ...data, isAgent: true });
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);
    socket.emit("isAgent", { chatId, isAgent: true });

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
      socket.emit("isAgent", { chatId, isAgent: false });
    };
  }, [socket, chatId]);
}
