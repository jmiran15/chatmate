import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardHeader } from "~/components/ui/card";

export default function KPICard({
  name,
  stat,
  change,
  changeType,
  icon: Icon,
}: {
  name: string;
  stat: string;
  change: string;
  changeType: "positive" | "negative";
  icon: LucideIcon;
}) {
  const trendColor =
    changeType === "positive" ? "text-green-600" : "text-red-600";
  const TrendIcon = changeType === "positive" ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-col">
        <div className="w-full flex flex-row items-center justify-start">
          <Icon className="inline h-4 w-4 mr-2 text-muted-foreground" />
          {name}
        </div>
        <div className="flex gap-2 items-center justify-start">
          <h3 className="text-2xl font-bold leading-none tracking-tight">
            {stat}
          </h3>
          <div
            className={`flex gap-1.5 items-center text-sm font-medium ${trendColor}`}
          >
            <TrendIcon className="h-4 w-4" />
            {changeType === "positive" ? "+" : "-"}
            {change}%
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
