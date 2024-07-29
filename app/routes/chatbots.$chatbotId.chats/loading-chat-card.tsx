import Skeleton from "react-loading-skeleton";
import { cn } from "~/lib/utils";

export function LoadingChatCard() {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 text-left text-sm transition-all mb-4 p-2 rounded-lg border bg-card text-card-foreground shadow-sm",
      )}
    >
      <div className="w-full ">
        <Skeleton width={"70%"} />
      </div>
      <div className="text-xs text-muted-foreground w-full">
        <Skeleton count={3} />
      </div>
    </div>
  );
}
