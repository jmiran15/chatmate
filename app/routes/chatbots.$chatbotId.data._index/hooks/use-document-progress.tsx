import { Document } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ProgressData } from "~/routes/api.chatbot.$chatbotId.data.progress";

// TODO - cache last progress values - e.g, user refreshes the page, wont see progress update until next progress event is sent. We can probably save in localforage indexDB on leave (like the infinte scroll restoration)
// TODO - percentage works - but there is a glitch - goes back and forth between certain values - should probably do as above
export function useDocumentProgress({
  item,
  progress,
}: {
  item: Document;
  progress: ProgressData | undefined;
}) {
  const { value: latestPreprocessingProgress } = useLatestProgress({
    queueNames: ["scrape", "parseFile"],
    progress,
  });
  const { value: latestIngestionProgress } = useLatestProgress({
    queueNames: ["ingestion"],
    progress,
  });

  const content = item?.content ??
    latestPreprocessingProgress?.returnvalue?.content ?? (
      <Skeleton count={10} />
    );

  const INGESTED = "Ingested";
  const PREPROCESSING = "Preprocessing";
  const INGESTING = `Ingesting ${Math.trunc(
    Number(latestIngestionProgress?.progress),
  )}%`;
  const status = item?.isPending
    ? latestIngestionProgress
      ? latestIngestionProgress.completed
        ? INGESTED
        : INGESTING
      : PREPROCESSING
    : INGESTED;

  return {
    content,
    status,
  };
}

export function useLatestProgress({
  queueNames,
  progress,
}: {
  queueNames: string[];
  progress: ProgressData | undefined;
}) {
  const [value, setValue] = useState<ProgressData | undefined>(undefined);
  const latestValueRef = useRef<ProgressData | undefined>(undefined);

  useEffect(() => {
    if (progress && queueNames.includes(progress.queueName)) {
      const newValue = progress;
      setValue(newValue);
      latestValueRef.current = newValue;
    }
  }, [progress]);

  // If progress is undefined, return the last known value
  return { value: progress === undefined ? latestValueRef.current : value };
}
