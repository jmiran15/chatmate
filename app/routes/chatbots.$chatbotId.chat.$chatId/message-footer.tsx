import { RotateCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ChatMessage, MessageRevisionStatus } from "./chat";
import { FixAnswerModal } from "./fix-answer-modal";

export function MessageFooter({
  status,
  question,
  revisionForMessageId,
  message,
  regenerateMessage,
}: {
  status: MessageRevisionStatus;
  question?: string;
  revisionForMessageId: string;
  message?: ChatMessage;
  regenerateMessage?: ({
    userInput,
    message,
  }: {
    userInput: string;
    message: ChatMessage;
  }) => void;
}) {
  return (
    <>
      {status === "waiting" && (
        <>
          <p className="text-xs text-muted-foreground">
            This answer may be incorrect or incomplete. Your input can help
            improve future responses.
          </p>

          <FixAnswerModal
            question={question}
            revisionForMessageId={revisionForMessageId}
          />
        </>
      )}
      {status === "processing" && (
        <p className="text-xs text-muted-foreground">
          This answer is being improved, you will be able to regenerate the
          answer once it is processed.
        </p>
      )}
      {status === "resolved" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            The answer has been improved with your feedback. You can regenerate
            the response to see how the new information is applied.
          </p>
          {question && message && regenerateMessage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                regenerateMessage({
                  userInput: question,
                  message,
                })
              }
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Regenerate response
            </Button>
          )}
        </div>
      )}
    </>
  );
}
