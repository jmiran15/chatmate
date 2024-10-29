import { AlertTriangle, Loader2, Zap } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { MessageRevisionStatus } from "./chat";

export function MessageStatusBadge({
  status,
}: {
  status: MessageRevisionStatus;
}) {
  return (
    <>
      {status !== null && (
        <Badge
          variant="outline"
          className={`
            ${
              status === "waiting"
                ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                : status === "processing"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-green-50 text-green-700 border-green-300"
            }
          `}
        >
          {status === "waiting" ? (
            <>
              <AlertTriangle className="w-3 h-3 mr-1" />
              May need improvement
            </>
          ) : status === "processing" ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing
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
