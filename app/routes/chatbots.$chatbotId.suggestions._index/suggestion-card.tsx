import { DateTime } from "luxon";
import { LinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";
import { Button } from "~/components/ui/button";

interface SuggestionCardProps {
  suggestion: {
    id: string;
    query: string;
    createdAt: string;
    status: "PENDING" | "RESOLVED" | "DISMISSED";
  };
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const formattedDate = DateTime.fromISO(suggestion.createdAt).toRelative();

  return (
    <LinkCard to={`${suggestion.id}`} className="hover:bg-accent">
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader title={`"${suggestion.query}"`} tag={undefined} />
        <LinkCardBody>
          <div className="flex justify-between items-center">
            <span>Suggested {formattedDate}</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                {suggestion.status === "PENDING" ? "Resolve" : "Unresolve"}
              </Button>
              <Button variant="outline" size="sm">
                View Chat
              </Button>
              <Button variant="outline" size="sm">
                {suggestion.status === "DISMISSED" ? "Undismiss" : "Dismiss"}
              </Button>
            </div>
          </div>
        </LinkCardBody>
      </div>
    </LinkCard>
  );
}
