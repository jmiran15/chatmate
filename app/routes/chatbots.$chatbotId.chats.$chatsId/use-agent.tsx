import { useEffect } from "react";
import { useSocket } from "~/providers/socket";

export default function useAgent(sessionId: string | null): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handlePollingIsAgent = (data: { sessionId: string }) => {
      if (sessionId === data.sessionId) {
        console.log(`${socket.id} - isAgent: `, { ...data, isAgent: true });
        socket.emit("isAgent", { ...data, isAgent: true });
      }
    };

    socket.on("pollingAgent", handlePollingIsAgent);
    console.log(`${socket.id} - isAgent: `, { sessionId, isAgent: true });
    socket.emit("isAgent", { sessionId, isAgent: true });

    return () => {
      socket.off("pollingAgent", handlePollingIsAgent);
      console.log(`${socket.id} - isAgent: `, { sessionId, isAgent: false });
      socket.emit("isAgent", { sessionId, isAgent: false });
    };
  }, [socket, sessionId]);
}
