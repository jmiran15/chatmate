import { FixAnswerModal } from "./fix-answer-modal";
import { MessageStatus } from "./message-status-badge";

export function MessageFooter({
  status,
  question,
}: {
  status: MessageStatus;
  question?: string;
}) {
  return (
    <>
      {status === "notProperlyAnswered" && (
        <>
          <p className="text-xs text-muted-foreground">
            This answer may be incorrect or incomplete. Your input can help
            improve future responses.
          </p>

          <FixAnswerModal question={question} />
        </>
      )}
      {status === "resolved" && (
        <p className="text-xs text-muted-foreground">
          This answer has been improved and will be used in future responses.
        </p>
      )}
    </>
  );
}
