import { cn } from "~/lib/utils";
import KPICard from "./kpi-card";
import { Card } from "~/components/ui/card";

export default function KPIs({
  data,
}: {
  data: {
    name: string;
    stat: number;
    change: number;
    changeType: "positive" | "negative";
    icon: React.ComponentType<{ className: string }>;
  }[];
}) {
  return (
    <Card className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0">
      {data.map((item, index) => (
        <KPICard
          {...item}
          key={item.name}
          className={cn(
            index !== 0 && "lg:pl-4 lg:border-l border-dashed border-border/80",
          )}
        />
      ))}
    </Card>
  );
}
