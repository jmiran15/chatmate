// what if we get progress here - keep documents in state and update them when progres changes
// then we can just send items to the infinite scroll list instead of each card having to calculate its content and status
// when we get usePendingDocuments (i.e. inflight documents that havent caused revalidation) we just add them to the "items" state
// and whenever we get progress we can update the state again

// and we can probably do the local storage stuff in the useBefore... where we save the scroll position - also note ... we need to change the name of the scroll position localstorage key
// can probably do the local storage stuff in client loader/action so that the "items" that we get from server is already the most up to date stuff - we just have to take care of new info!!!

// PROBABLY CLEANEST WAY TO DO THIS ^^^^^

import { Document } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import { ProgressData } from "~/routes/api.chatbot.$chatbotId.data.progress";
import { OptimisticDocument } from "../route";
import { getFromLocalStorage, setToLocalStorage } from "./use-local-storage";
import { usePendingDocuments } from "./use-pending-documents";

export function useOptimisticDocuments({
  items,
}: {
  items: SerializeFrom<Document[]> | undefined;
}): {
  documents: OptimisticDocument[];
} {
  const { chatbotId } = useParams();
  const [documents, setDocuments] = useState<OptimisticDocument[]>([]);
  const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  const progress: ProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);
  const pendingDocuments = usePendingDocuments(); // TODO: integrate this (optimistic UI)

  const localStorageKey = useMemo(
    () => `document_progress_${chatbotId}`,
    [chatbotId],
  );

  const preprocessingQueues = ["scrape", "parseFile"];
  const ingestionQueues = ["ingestion", "qaingestion"];

  const prevItemsRef = useRef<SerializeFrom<Document[]> | undefined>();
  const progressQueueRef = useRef<ProgressData[]>([]);

  const updateDocumentFromProgress = useCallback(
    (
      doc: OptimisticDocument,
      progressData: ProgressData,
    ): OptimisticDocument => {
      let updatedDoc = { ...doc };
      if (preprocessingQueues.includes(progressData.queueName)) {
        updatedDoc.content = progressData.returnvalue?.content ?? doc.content;
        updatedDoc.preprocessingCompleted = progressData.completed;
      } else if (ingestionQueues.includes(progressData.queueName)) {
        updatedDoc.isPending = !progressData.completed;
        updatedDoc.status = progressData.completed
          ? "Ingested"
          : `Ingesting ${Math.trunc(Number(progressData.progress))}%`;
      }
      return updatedDoc;
    },
    [preprocessingQueues, ingestionQueues],
  );

  // Sync with server and localStorage
  useEffect(() => {
    if (!items || items === prevItemsRef.current) return;

    prevItemsRef.current = items;

    const storedProgress = getFromLocalStorage<Record<string, ProgressData>>(
      localStorageKey,
      {},
    );
    const updatedDocuments = items.map((item) => {
      const doc: OptimisticDocument = {
        ...item,
        status: item.isPending ? "Ingesting" : "Ingested",
        preprocessingCompleted: item.content ? true : false,
      };
      const progressData = storedProgress[item.id];

      if (!progressData) {
        return doc;
      }

      if (!item.isPending) {
        // remove the progress data from localStorage
        delete storedProgress[item.id];
        return doc;
      } else {
        // lets check which is more up to date
        if (preprocessingQueues.includes(progressData.queueName)) {
          // lets check if localstorage says we are still preprocessing, but db says we are not
          if (doc.content) {
            // we have content, so we can remove the progress data from localStorage
            delete storedProgress[item.id];
            return doc;
          }
        }

        // if we get here, then we have an ingestion progfress, and the db says we are still pending, so we are correct
        return updateDocumentFromProgress(doc, progressData);
      }
    });

    setDocuments(updatedDocuments);

    // Cleanup localStorage
    const newStoredProgress: Record<string, ProgressData> = {};
    updatedDocuments.forEach((doc) => {
      if (doc.isPending && storedProgress[doc.id]) {
        newStoredProgress[doc.id] = storedProgress[doc.id];
      }
    });
    setToLocalStorage(localStorageKey, newStoredProgress);
  }, [items, localStorageKey, updateDocumentFromProgress]);

  // TODO - keep in synch with pending documents

  // Handle progress updates
  useEffect(() => {
    if (!progress) return;

    progressQueueRef.current.push(progress);

    const processQueue = () => {
      setDocuments((prevDocuments) => {
        let updatedDocuments = [...prevDocuments];
        const storedProgress = getFromLocalStorage<
          Record<string, ProgressData>
        >(localStorageKey, {});

        while (progressQueueRef.current.length > 0) {
          const currentProgress = progressQueueRef.current.shift()!;
          updatedDocuments = updatedDocuments.map((doc) =>
            doc.id === currentProgress.documentId
              ? updateDocumentFromProgress(doc, currentProgress)
              : doc,
          );

          if (
            ingestionQueues.includes(currentProgress.queueName) &&
            currentProgress.completed
          ) {
            delete storedProgress[currentProgress.documentId];
          } else {
            storedProgress[currentProgress.documentId] = currentProgress;
          }
        }

        setToLocalStorage(localStorageKey, storedProgress);
        return updatedDocuments;
      });
    };

    // Debounce the processing to reduce state updates
    const timeoutId = setTimeout(processQueue, 100);

    return () => clearTimeout(timeoutId);
  }, [progress, localStorageKey, updateDocumentFromProgress, ingestionQueues]);

  return { documents };
}
