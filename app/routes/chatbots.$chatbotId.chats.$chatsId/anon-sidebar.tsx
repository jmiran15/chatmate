import { AnonymousUser } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { formatDuration, intervalToDuration } from "date-fns";
import { FancyBox } from "./labels/labels-combobox";
import { loader } from "./route";
import StatusComboboxPopover from "./status-combobox";

export default function AnonSidebar({
  anonUser,
  widgetConnected,
}: {
  anonUser: SerializeFrom<AnonymousUser> | null;
  widgetConnected: boolean;
}) {
  const status = widgetConnected ? "Connected" : "Disconnected";
  const { chat } = useLoaderData<typeof loader>();
  const duration = intervalToDuration({
    start: 0,
    end: Number(chat?.elapsedMs),
  });
  const formattedDuration = formatDuration(duration, {
    format: ["hours", "minutes", "seconds"],
    zero: true,
    delimiter: ":",
  });

  return (
    <div className="flex flex-col col-span-3 overflow-y-auto h-full border-l p-5 gap-2">
      <StatusComboboxPopover />
      <div className="flex items-start justify-start gap-2 w-full">
        <p className="text-sm text-muted-foreground">Labels</p>
        <FancyBox />
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <p className="text-sm text-muted-foreground">User </p>
        <small className="text-sm font-medium leading-none">{status}</small>
      </div>

      <div className="flex items-center justify-start gap-2 w-full">
        <p className="text-sm text-muted-foreground">Active time</p>
        <small className="text-sm font-medium leading-none">
          {formattedDuration}
        </small>
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
