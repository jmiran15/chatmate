import { AnonymousUser } from "@prisma/client";
import { useEffect, useState } from "react";
import { useSocket } from "~/providers/socket";
import StatusComboboxPopover from "./status-combobox";
import { FancyBox } from "./labels/labels-combobox";

export default function AnonSidebar({
  anonUser,
  sessionId,
}: {
  anonUser: AnonymousUser;
  sessionId: string;
}) {
  const { status } = useWidgetConnectionStatus(sessionId);

  return (
    <div className="flex flex-col col-span-3 overflow-y-auto h-full border-l p-5 gap-2">
      {/* actions stuff */}
      <StatusComboboxPopover />
      <div className="flex items-start justify-start gap-2 w-full">
        <p className="text-sm text-muted-foreground">Labels</p>
        <FancyBox />
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <p className="text-sm text-muted-foreground">User </p>
        <small className="text-sm font-medium leading-none">{status}</small>
      </div>
      {anonUser
        ? (Object.keys(anonUser) as (keyof AnonymousUser)[]).map(
            (key) =>
              key !== "id" &&
              key !== "createdAt" &&
              key !== "updatedAt" &&
              key !== "sessionId" &&
              anonUser?.[key] &&
              key !== "ua" && (
                <div
                  className="flex items-center justify-start gap-2 w-full"
                  key={key}
                >
                  <p className="text-sm text-muted-foreground">{key}</p>
                  <small className="text-sm font-medium leading-none">
                    {anonUser?.[key]}
                  </small>
                </div>
              ),
          )
        : null}
    </div>
  );
}

function useWidgetConnectionStatus(sessionId: string): {
  status: "Connected" | "Disconnected";
} {
  const [widgetConnected, setWidgetConnected] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

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

  return { status: widgetConnected ? "Connected" : "Disconnected" };
}
