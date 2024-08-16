import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import tagsEmptyImage from "~/images/tags-empty.png";
import { EmptyState } from "../EmptyState";

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function TagsChart({
  tags,
  labels,
}: {
  tags: { label: string; count: number }[];
  labels: {
    name: string;
    color: string;
  }[];
}) {
  const chartConfig = labels.reduce(
    (config: ChartConfig, label: { name: string; color: string }) => {
      config[label.name] = {
        label: label.name.charAt(0).toUpperCase() + label.name.slice(1),
        color: label.color,
      };
      return config;
    },
    {
      Unlabeled: {
        label: "Unlabeled",
        color: "#e5e7eb", // gray-200
      },
    },
  );

  const chartData = tags.map((tag: { label: string; count: number }) => ({
    name: tag.label,
    value: tag.count,
    fill: chartConfig[tag.label]?.color || getRandomColor(),
  }));

  const isEmptyData = tags.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-start pb-0">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Labels</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                {tags.length} labels
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-0">
        {isEmptyData ? (
          <EmptyState
            image={tagsEmptyImage}
            title="No tags data yet"
            description="Add tags to your chats to see them visualized here."
            className="h-full"
          />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-full w-full flex items-center justify-center"
          >
            <PieChart className="w-full h-full">
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie data={chartData} dataKey="value" />
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
