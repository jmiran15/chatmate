import { Document } from "@prisma/client";
import { useMemo, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import { ProgressData } from "~/routes/api.chatbot.$chatbotId.data.progress";

export function useDocumentProgress(item: Document, progress: ProgressData) {
  const previousProgress = useRef<JSX.Element | string | undefined>();
  const previousStatus = useRef<string | undefined>();
  const preprocessingQueueNames = ["scrape", "parseFile"];

  return useMemo(() => {
    let content = previousProgress.current || <Skeleton />;
    let status = previousStatus.current || "Preprocessing";

    if (item.content) {
      content = item.content;
      status = "Ingested";
    } else if (progress) {
      if (
        preprocessingQueueNames.includes(progress?.queueName) &&
        progress?.returnvalue?.content
      ) {
        content = progress?.returnvalue?.content;
        previousProgress.current = content;
      }

      status = progress?.completed
        ? "Ingested"
        : progress?.progress
        ? `Ingesting ${Math.trunc(Number(progress?.progress))}%`
        : "Preprocessing";

      previousStatus.current = status;
    }

    return { status, content };
  }, [item.id, progress]);
}
