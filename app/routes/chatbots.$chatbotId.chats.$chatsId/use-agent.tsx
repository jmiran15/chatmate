import { useEffect } from "react";
import { useSocket } from "~/providers/socket";

export default function useAgent(sessionId: string | null): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handlePollingIsAgent = (data: { sessionId: string }) => {
      if (sessionId === data.sessionId) {
        socket.emit("isAgent", { ...data, isAgent: true });
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);
    socket.emit("isAgent", { sessionId, isAgent: true });

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
      socket.emit("isAgent", { sessionId, isAgent: false });
    };
  }, [socket, sessionId]);
}
