import { Link } from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface FlowCardProps {
  flow: {
    id: string;
    name: string;
    lastUpdated: string;
  };
}

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link to={flow.id}>
        <CardHeader>
          <CardTitle>{flow.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Last updated {formatDistanceToNow(new Date(flow.lastUpdated))} ago
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
