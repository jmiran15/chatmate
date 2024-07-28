import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "~/components/ui/chart";

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function TagsChart({ tags, labelNames }: any) {
  const chartConfig = labelNames.reduce(
    (config: ChartConfig, label: string, index: number) => {
      config[label] = {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        color: getRandomColor(),
      };
      return config;
    },
    {
      Unlabeled: {
        label: "Unlabeled",
        color: getRandomColor(),
      },
    },
  );

  const chartData = tags.map((tag: { label: string; count: number }) => ({
    name: tag.label,
    value: tag.count,
    fill: chartConfig[tag.label]?.color || getRandomColor(),
  }));

  console.log("TAGS: ", { chartConfig, chartData });
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-start pb-0">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Pages</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                17 unique pages viewed
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="value" />
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
