// app/routes/chatbots.$chatbotId.data._index/hooks/use-document-progress.tsx

import { Document } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ProgressData } from "~/routes/api.chatbot.$chatbotId.data.progress";
import {
  useLocalStorage,
  getFromLocalStorage,
  setToLocalStorage,
} from "./use-local-storage";
import { SerializeFrom } from "@remix-run/node";

export function useDocumentProgress({
  item,
  progress,
}: {
  item: SerializeFrom<Document>;
  progress: ProgressData | undefined;
}) {
  const [cachedProgress, setCachedProgress] = useLocalStorage<
    ProgressData | undefined
  >(`document-progress-${item.id}`, undefined);

  const [content, setContent] = useState<React.ReactNode>(() => {
    const storedContent = getFromLocalStorage<string | null>(
      `document-content-${item.id}`,
      null,
    );
    return storedContent ?? item?.content ?? <Skeleton count={10} />;
  });

  const { value: latestPreprocessingProgress } = useLatestProgress({
    queueNames: ["scrape", "parseFile"],
    progress,
    cachedProgress,
  });
  const { value: latestIngestionProgress } = useLatestProgress({
    queueNames: ["ingestion"],
    progress,
    cachedProgress,
  });

  useEffect(() => {
    if (item?.content) {
      setContent(item.content);
      setToLocalStorage(`document-content-${item.id}`, item.content);
    } else if (latestPreprocessingProgress?.returnvalue?.content) {
      setContent(latestPreprocessingProgress.returnvalue.content);
      setToLocalStorage(
        `document-content-${item.id}`,
        latestPreprocessingProgress.returnvalue.content,
      );
    }
  }, [item?.content, latestPreprocessingProgress, item.id]);

  const INGESTED = "Ingested";
  const PREPROCESSING = "Preprocessing";
  const INGESTING = `Ingesting ${Math.trunc(
    Number(latestIngestionProgress?.progress),
  )}%`;

  let status = INGESTED;
  if (item?.isPending) {
    if (latestIngestionProgress) {
      status = latestIngestionProgress.completed ? INGESTED : INGESTING;
    } else if (latestPreprocessingProgress) {
      status = latestPreprocessingProgress.completed
        ? PREPROCESSING
        : PREPROCESSING;
    } else {
      status = PREPROCESSING;
    }
  }

  useEffect(() => {
    if (progress && progress.documentId === item.id) {
      setCachedProgress(progress);
    }
  }, [progress, item.id, setCachedProgress]);

  return {
    content,
    status,
  };
}

export function useLatestProgress({
  queueNames,
  progress,
  cachedProgress,
}: {
  queueNames: string[];
  progress: ProgressData | undefined;
  cachedProgress: ProgressData | undefined;
}) {
  const [value, setValue] = useState<ProgressData | undefined>(cachedProgress);
  const latestValueRef = useRef<ProgressData | undefined>(cachedProgress);

  useEffect(() => {
    if (progress && queueNames.includes(progress.queueName)) {
      const newValue = progress;
      setValue(newValue);
      latestValueRef.current = newValue;
    }
  }, [progress, queueNames]);

  return { value: progress === undefined ? latestValueRef.current : value };
}
