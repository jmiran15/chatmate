import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../../components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { memo } from "react";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";

export const DocumentCard = memo(function DocumentCard({
  item,
  ingestionProgress,
  preprocessingProgress,
}: {
  item: Document;
  ingestionProgress: ProgressData | null;
  preprocessingProgress: ProgressData | null;
}) {
  let content;
  let status;

  if (item.content) {
    content = item.content;
  } else {
    content = preprocessingProgress?.completed ? (
      preprocessingProgress?.returnvalue?.content
    ) : (
      <Skeleton count={10} />
    );
  }

  if (!item.isPending) {
    status = "Ingested";
  } else {
    status = ingestionProgress?.completed
      ? "Ingested"
      : ingestionProgress?.progress
      ? `Ingesting ${Math.trunc(Number(ingestionProgress?.progress))}%`
      : "Preprocessing";
  }

  return (
    <Link
      to={item?.id}
      className="flex flex-col-reverse sm:flex-row items-start justify-between rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent p-6 gap-2 md:gap-8"
    >
      <div className="flex flex-col space-y-1.5 items-start justify-start shrink w-full">
        <div className="font-semibold">{item?.name}</div>
        <div className="line-clamp-2 text-sm text-muted-foreground text-wrap w-full">
          {content}
        </div>
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
});
