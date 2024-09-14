import { Link } from "@remix-run/react";
import { DateTime } from "luxon";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";

interface FormCardProps {
  form: {
    id: string;
    name: string;
    lastUpdated: string;
    submissionCount: number;
  };
}

export function FormCard({ form }: FormCardProps) {
  const formattedDate = DateTime.fromISO(form.lastUpdated).toRelative();

  return (
    <Link to={`${form.id}`} className="block w-full">
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col w-full gap-2">
            <CardTitle>{form.name}</CardTitle>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{form.submissionCount} submissions</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
