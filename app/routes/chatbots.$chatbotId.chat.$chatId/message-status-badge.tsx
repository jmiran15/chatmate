import { AlertTriangle, Zap } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export type MessageStatus = "regular" | "notProperlyAnswered" | "resolved";

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  return (
    <>
      {status !== "regular" && (
        <Badge
          variant="outline"
          className={`
            ${
              status === "notProperlyAnswered"
                ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                : "bg-green-50 text-green-700 border-green-300"
            }
          `}
        >
          {status === "notProperlyAnswered" ? (
            <>
              <AlertTriangle className="w-3 h-3 mr-1" />
              May need improvement
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 mr-1" />
              Answer improved
            </>
          )}
        </Badge>
      )}
    </>
  );
}
