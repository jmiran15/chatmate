import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ChatsChart() {
  return (
    <Card>
      <CardHeader className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Chats</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="relative w-2 h-2">
                <div className="animate-[pulsate_1s_ease-out_infinite] opacity-0 absolute h-2 w-2 rounded-full bg-green-600"></div>
                <div className="h-2 w-2 absolute rounded-full bg-green-600"></div>
              </div>
              <div className="text-sm text-muted-foreground leading-none">
                6 online
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div
            className="
          text-[32px] leading-none tracking-[-0.1px] font-bold"
          >
            <div>
              <span>1,200</span>
            </div>
          </div>
          <div className="flex flex-col h-full py-[2px] items-start justify-between gap-[2px] min-w-[130px]">
            <div className="flex gap-1.5 items-center text-[13px] leading-none font-medium text-red-600">
              <TrendingUp className="h-3 w-3" />
              5.2%
            </div>

            <div className="leading-none text-muted-foreground text-[13px]">
              vs previous 30 days
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} horizontal={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill="var(--color-desktop)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="mobile"
              stackId="a"
              fill="var(--color-mobile)"
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
