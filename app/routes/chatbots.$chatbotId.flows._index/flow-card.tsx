import { DateTime } from "luxon";
import { LinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";

interface FlowCardProps {
  flow: {
    id: string;
    name: string;
    lastUpdated: string;
  };
}

export function FlowCard({ flow }: FlowCardProps) {
  const formattedDate = DateTime.fromISO(flow.lastUpdated).toRelative();

  return (
    <LinkCard to={`${flow.id}`}>
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader title={flow.name} tag={undefined} />
        <LinkCardBody>
          <span>Last updated {formattedDate}</span>
        </LinkCardBody>
      </div>
    </LinkCard>
  );
}
