import { TrendingUp } from "lucide-react";
import { DateTime } from "luxon";
import { Bar, BarChart, XAxis } from "recharts";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import chatsEmptyImage from "~/images/chats-empty.png";
import { EmptyState } from "../EmptyState";

const chartConfig = {
  chats: {
    label: "chats",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface Chat {
  date: string;
  chats: number;
}

const formatXAxis = (tickItem: string, period: string) => {
  const date = DateTime.fromISO(tickItem, { zone: "utc" });

  switch (period) {
    case "1hr":
      return date.toFormat("HH:mm");
    case "24hr":
      return date.toFormat("HH:mm");
    case "7d":
      return date.toFormat("ccc dd");
    case "30d":
      return date.toFormat("dd MMM");
    case "6m":
    case "12m":
      return date.toFormat("MMM");
    default:
      return date.toFormat("MMM");
  }
};

const getDateInterval = (period: string) => {
  switch (period) {
    case "1hr":
      return { interval: { minutes: 5 }, unit: "minute" };
    case "24hr":
      return { interval: { hours: 1 }, unit: "hour" };
    case "7d":
      return { interval: { days: 1 }, unit: "day" };
    case "30d":
      return { interval: { days: 1 }, unit: "day" };
    case "6m":
      return { interval: { months: 1 }, unit: "month" };
    case "12m":
      return { interval: { months: 1 }, unit: "month" };
    default:
      return { interval: { days: 1 }, unit: "day" };
  }
};

const fillMissingDates = (chats: Chat[], period: string) => {
  const { interval, unit } = getDateInterval(period);
  const now = DateTime.now().setZone("utc");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDate = now.minus(getPeriodDuration(period)).startOf(unit as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endDate = now.endOf(unit as any);

  let currentDate = startDate;
  const filledChats = [];

  while (currentDate <= endDate) {
    const existingChats = chats.filter((chat) => {
      const chatDate = DateTime.fromISO(chat.date, { zone: "utc" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return chatDate.hasSame(currentDate, unit as any);
    });

    const chatsCount = existingChats.reduce((sum, chat) => sum + chat.chats, 0);
    filledChats.push({
      date: currentDate.toISO(),
      chats: chatsCount,
    });

    currentDate = currentDate.plus(interval);
  }

  return filledChats;
};

const getPeriodDuration = (period: string) => {
  switch (period) {
    case "1hr":
      return { hours: 1 };
    case "24hr":
      return { days: 1 };
    case "7d":
      return { days: 7 };
    case "30d":
      return { days: 30 };
    case "6m":
      return { months: 6 };
    case "12m":
      return { months: 12 };
    default:
      return { days: 30 };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ChatsChart({ chats, period, percentageChanges }: any) {
  const filledChats = fillMissingDates(chats, period);
  const totalChats = filledChats.reduce((sum, chat) => sum + chat.chats, 0);

  const isEmptyData = totalChats === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="w-full flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Chats</div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="text-[32px] leading-none tracking-[-0.1px] font-bold">
            <div>
              <span>{totalChats.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col h-full py-[2px] items-start justify-between gap-[2px] min-w-[130px]">
            <div
              className={`flex gap-1.5 items-center text-[13px] leading-none font-medium ${
                percentageChanges.totalChats >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              {Math.abs(percentageChanges.totalChats).toFixed(1)}%
            </div>
            <div className="leading-none text-muted-foreground text-[13px]">
              vs previous {period}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {isEmptyData ? (
          <EmptyState
            image={chatsEmptyImage}
            title="No chat data yet"
            description="Start conversations with your chatbot to see analytics here."
            className="h-full"
          />
        ) : (
          <ChartContainer config={chartConfig} className="h-full">
            <BarChart data={filledChats}>
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => formatXAxis(value, period)}
                interval={
                  period === "1hr"
                    ? 11
                    : period === "24hr"
                    ? 3
                    : period === "30d"
                    ? 3
                    : 0
                }
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [value.toLocaleString(), " Chats"]}
                    hideLabel
                  />
                }
              />
              <Bar dataKey="chats" fill="#3ba6f1" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
