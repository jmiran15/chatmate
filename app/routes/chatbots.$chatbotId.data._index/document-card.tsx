import { Document } from "@prisma/client";
import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../../components/ui/badge";

export default function DocumentCard({ document }: { document: Document }) {
  return (
    <Link
      to={document.id}
      className="flex items-start justify-between rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent p-6 gap-2 md:gap-8"
    >
      <div className="flex flex-col space-y-1.5 items-start justify-start shrink">
        <div className="font-semibold leading-none tracking-tight">
          {document.name}
        </div>
        <div className="line-clamp-2 text-sm text-muted-foreground text-wrap">
          {document.content}
        </div>
      </div>
      <div className="flex flex-col items-end justify-start space-y-1.5 flex-1 shrink-0">
        <div className="text-xs text-muted-foreground text-nowrap">
          {formatDistanceToNow(new Date(document.createdAt), {
            addSuffix: true,
          })}
        </div>
        <Badge variant="outline">Ingesting</Badge>
      </div>
    </Link>
  );
}
