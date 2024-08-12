import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../../components/ui/badge";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import { useDocumentProgress } from "./hooks/use-document-progress";
import { useMemo } from "react";
import { SerializeFrom } from "@remix-run/node";

function highlightText(text: string, matches: string[]): JSX.Element {
  const parts = text.split(new RegExp(`(${matches.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        matches.some((match) => part.toLowerCase() === match.toLowerCase()) ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function extractRelevantContent(
  content: string,
  matches: string[],
  contextLength: number = 100,
): string {
  const lowerContent = content.toLowerCase();
  const firstMatchIndex = Math.min(
    ...matches
      .map((match) => lowerContent.indexOf(match.toLowerCase()))
      .filter((index) => index !== -1),
  );

  if (firstMatchIndex === Infinity) return content.slice(0, contextLength);

  const start = Math.max(0, firstMatchIndex - contextLength / 2);
  const end = Math.min(content.length, start + contextLength);

  return (
    (start > 0 ? "..." : "") +
    content.slice(start, end) +
    (end < content.length ? "..." : "")
  );
}

export function DocumentCard({
  item,
  progress,
  searchMatches,
}: {
  item: SerializeFrom<Document>;
  progress: ProgressData | undefined;
  searchMatches?: string[];
}) {
  const { content, status } = useDocumentProgress({ item, progress });

  const displayContent = useMemo(() => {
    if (typeof content !== "string") return content;
    return searchMatches
      ? extractRelevantContent(content, searchMatches)
      : content.slice(0, 100) + (content.length > 100 ? "..." : "");
  }, [content, searchMatches]);

  const highlightedName = useMemo(() => {
    return searchMatches && typeof item?.name === "string"
      ? highlightText(item.name, searchMatches)
      : item?.name;
  }, [item?.name, searchMatches]);

  const highlightedContent = useMemo(() => {
    return searchMatches && typeof displayContent === "string"
      ? highlightText(displayContent, searchMatches)
      : displayContent;
  }, [displayContent, searchMatches]);

  return (
    <Link
      to={item?.id}
      className="flex flex-col-reverse sm:flex-row items-start justify-between rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent p-6 gap-2 md:gap-8 mb-4"
    >
      <div className="flex flex-col space-y-1.5 items-start justify-start shrink w-full">
        <div className="font-semibold">{highlightedName}</div>
        <div className="line-clamp-2 text-sm text-muted-foreground text-wrap w-full">
          {highlightedContent}
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
}
