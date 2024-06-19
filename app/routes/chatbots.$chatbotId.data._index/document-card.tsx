import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../../components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { memo, useMemo, useRef } from "react";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";

export const DocumentCard = memo(function DocumentCard({
  item,
  progress,
}: {
  item: Document;
  progress: ProgressData | undefined;
}) {
  // TODO - we should extract all this stuff into a custom hook!

  // TODO - maybe we need to memo both of these calculations so that they dont change if the progress queuename changes
  const previousProgress = useRef();
  const preprocessingQueueNames = ["scrape", "parseFile"];

  const memoizedContent = useMemo(() => {
    let content;

    if (item.content) {
      content = item.content;
    } else if (!progress) {
      // TODO - there is a bug here, where the content is not changing even though the item changed completely
      content = previousProgress.current || <Skeleton count={10} />;
    } else {
      const cond =
        !preprocessingQueueNames.includes(progress?.queueName) &&
        !progress?.returnvalue?.content;

      if (cond) {
        content = previousProgress.current || <Skeleton count={10} />;
      } else {
        // we are preprocessing and have a return value
        content = progress?.returnvalue?.content;
        previousProgress.current = content;
      }
    }

    return content;
  }, [item, progress]);

  // TODO - percentage works - but there is a glitch - goes back and forth between certain values - should probably do as above
  // since it's last progress will be the ingestion step - this might still work - but we should be careful.
  let status;

  if (!item.isPending) {
    status = "Ingested";
  } else {
    status = progress?.completed
      ? "Ingested"
      : progress?.progress
      ? `Ingesting ${Math.trunc(Number(progress?.progress))}%`
      : "Preprocessing";
  }

  return (
    <Link
      to={item?.id}
      className="flex flex-col-reverse sm:flex-row items-start justify-between rounded-lg border bg-card text-card-foreground shadow-sm p-6 gap-2 md:gap-8"
    >
      <div className="flex flex-col space-y-1.5 items-start justify-start shrink w-full">
        <div className="font-semibold">{item?.name}</div>
        <div className="line-clamp-2 text-sm text-muted-foreground text-wrap w-full">
          {memoizedContent}
        </div>
        <div>Optimistic: {item?.id ?? "Yes"}</div>
        <div className="flex flex-row items-center gap-4">
          <div className="text-xs text-muted-foreground text-nowrap">
            {item?.type}
          </div>
          <div className="text-xs text-muted-foreground text-nowrap">
            {formatDistanceToNow(new Date(item?.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-start space-y-1.5 flex-1 shrink-0">
        <Badge variant={"secondary"}>{status}</Badge>
      </div>
    </Link>
  );
}, arePropsEqual);

function arePropsEqual(prev: any, next: any) {
  console.log(
    "arePropsEqual - ",
    prev.item.name,
    prev.progress,
    next.progress,
    Object.is(prev.progress, next.progress) ||
      (!next.progress && prev.progress),
  );

  // can probably combine the two checks into one
  return (
    (Object.is(prev.progress, next.progress) ||
      (!next.progress && prev.progress)) &&
    Object.is(prev.item, next.item)
  );
}
