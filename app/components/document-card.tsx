import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";

export default function DocumentCard({ document }: { document: Document }) {
  return (
    <Link
      to={document.id}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold">{document.name}</div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(document.createdAt), {
              addSuffix: true,
            })}{" "}
          </div>
        </div>
      </div>
      <div className="line-clamp-2 text-xs text-muted-foreground">
        {document.content?.substring(0, 300)}
      </div>
    </Link>
  );
}
