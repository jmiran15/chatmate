// import { Document } from "@prisma/client";
// import { useEffect, useRef, useState } from "react";
// import Skeleton from "react-loading-skeleton";
// import "react-loading-skeleton/dist/skeleton.css";
// import { ProgressData } from "~/routes/api.chatbot.$chatbotId.data.progress";

// export function useDocumentProgress({
//   item,
//   progress,
// }: {
//   item: Document;
//   progress: ProgressData | undefined;
// }) {
//   const [content, setContent] = useState<React.ReactNode>(
//     item?.content ?? <Skeleton count={10} />,
//   );
//   const [status, setStatus] = useState<string>("Pending");
//   const latestProgressRef = useRef<ProgressData | undefined>(undefined);

//   useEffect(() => {
//     if (progress) {
//       latestProgressRef.current = progress;
//       updateProgressState(progress);
//     }
//   }, [progress]);

//   useEffect(() => {
//     // Load persisted progress from localStorage on mount
//     const persistedProgress = JSON.parse(
//       localStorage.getItem(`document-${item.id}`) || "{}",
//     );
//     if (persistedProgress) {
//       setContent(persistedProgress.content);
//       setStatus(persistedProgress.status);
//     }
//   }, [item.id]);

//   useEffect(() => {
//     // Save progress to localStorage on state change
//     const handleStateChange = () => {
//       const currentState = { content, status };
//       localStorage.setItem(`document-${item.id}`, JSON.stringify(currentState));
//     };

//     const handleProgressChange = () => {
//       if (latestProgressRef.current) {
//         handleStateChange();
//       }
//     };

//     handleProgressChange();
//   }, [content, status, item.id, latestProgressRef]);

//   const updateProgressState = (newProgress: ProgressData) => {
//     const { documentId, queueName, progress, completed, returnvalue } =
//       newProgress;
//     if (documentId === item.id) {
//       if (queueName === "scrape" || queueName === "parseFile") {
//         if (progress === 100) {
//           setContent(returnvalue?.content ?? <Skeleton count={10} />);
//           setStatus("Ingested");
//         } else {
//           setContent(<Skeleton count={10} />);
//           setStatus(`Ingesting ${Math.trunc(progress)}%`);
//         }
//       } else if (queueName === "ingestion") {
//         if (completed) {
//           setContent(returnvalue?.content ?? <Skeleton count={10} />);
//           setStatus("Ingested");
//         } else {
//           setContent(<Skeleton count={10} />);
//           setStatus(`Ingesting ${Math.trunc(progress)}%`);
//         }
//       }
//     }
//   };

//   return { content, status };
// }

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
