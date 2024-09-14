import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";

interface FlowCardProps {
  flow: {
    id: string;
    name: string;
    lastUpdated: string;
  };
}

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <Link to={`${flow.id}`} className="block w-full">
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col w-full gap-2">
            <CardTitle>{flow.name}</CardTitle>
            <p className="text-sm text-gray-500">
              Last updated {formatDistanceToNow(new Date(flow.lastUpdated))} ago
            </p>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
