import { useEffect, useState } from "react";
import { useSocket } from "~/providers/socket";

export default function useWidgetConnectionStatus(sessionId: string | null): {
  widgetConnected: boolean;
} {
  const [widgetConnected, setWidgetConnected] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    console.log(
      "useWidgetConnectionStatus mounted",
      sessionId,
      widgetConnected,
    );

    // Reset the connection status when the effect runs
    setWidgetConnected(false);

    const handleWidgetConnected = (data: {
      sessionId: string;
      connected: boolean;
    }) => {
      if (sessionId === data.sessionId) {
        console.log(`${sessionId} - widgetConnected: `, data);
        setWidgetConnected(data.connected);
      }
    };

    socket.on("widgetConnected", handleWidgetConnected);

    console.log("anon-sidebar.tsx - polling for widget status, ", sessionId);
    socket.emit("pollingWidgetStatus", { sessionId });

    return () => {
      console.log("useWidgetConnectionStatus unmounted", sessionId);
      socket.off("widgetConnected", handleWidgetConnected);
      setWidgetConnected(false); // Reset the state when unmounting
    };
  }, [socket, sessionId]);

  return { widgetConnected };
}
