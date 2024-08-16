import { LucideIcon } from "lucide-react";
import KPICard from "./kpi-card";

export default function KPIs({
  data,
}: {
  data: {
    name: string;
    stat: string;
    change: string;
    changeType: "positive" | "negative";
    icon: LucideIcon;
  }[];
}) {
  return (
    <>
      {data.map((item) => (
        <KPICard {...item} key={item.name} />
      ))}
    </>
  );
}
