import { DateTime } from "luxon";
import { LinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";

export function FormCard({
  form,
}: {
  form: {
    id: string;
    name: string;
    lastUpdated: string;
    submissionCount: number;
  };
}) {
  const formattedDate = DateTime.fromISO(form.lastUpdated).toRelative();

  return (
    <LinkCard to={`${form.id}`}>
      <div className="p-4 flex flex-col gap-1">
        <LinkCardHeader
          title={form.name}
          tag={<span>{form.submissionCount} submissions</span>}
        />
        <LinkCardBody>
          <span>Last updated {formattedDate}</span>
        </LinkCardBody>
      </div>
    </LinkCard>
  );
}
