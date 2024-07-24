import { TrendingDown } from "lucide-react";

export default function KPICard({
  className,
  name,
  stat,
  change,
  changeType,
  icon: Icon,
}: {
  className?: string;
  name: string;
  stat: number;
  change: number;
  changeType: "positive" | "negative";
  icon: React.ComponentType<{ className: string }>;
}) {
  return (
    <div
      className={`flex flex-col gap-3 md:justify-between items-start ${className}`}
    >
      <div className="flex flex-col gap-1">
        <div className="font-medium leading-none flex items-center text-sm">
          <Icon className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          {name}
        </div>
      </div>
      <div className="flex gap-2 items-end">
        <h3 className="leading-none font-semibold text-lg tracking-tight">
          <span>{stat.toLocaleString()}</span>
        </h3>
        <div
          className={`flex gap-1.5 items-center text-[13px] leading-none font-medium ${
            changeType === "positive" ? "text-green-600" : "text-red-600"
          }`}
        >
          <TrendingDown className="h-3 w-3" />
          {changeType === "positive" ? "+" : "-"}
          {Math.abs(change)}%
        </div>
      </div>
    </div>
  );
}
