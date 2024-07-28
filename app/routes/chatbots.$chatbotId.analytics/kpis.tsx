import KPICard from "./kpi-card";

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
      {data.map((item) => (
        <KPICard {...item} key={item.name} />
      ))}
    </div>
  );
}
