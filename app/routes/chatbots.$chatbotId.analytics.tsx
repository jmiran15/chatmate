import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LineChart, Card } from "@tremor/react";
import { cn } from "~/lib/utils";
import { getChatsByChatbotId } from "~/models/chat.server";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { useMemo } from "react";
import Blur from "~/components/analytics/blur";
import { requireUserId } from "~/session.server";
import { isProUser } from "~/models/user.server";

// Types for the data
interface ChatMessage {
  createdAt: string;
}

interface Chat {
  createdAt: string;
  messages: ChatMessage[];
}

type ChatData = Chat[];

// Function to get total chats
const getTotalChats = (data: ChatData): number => {
  return data.length;
};

// Function to calculate percent change
const calculatePercentChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue === 0 ? 0 : 100;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Function to get weekly chats
const getWeeklyChats = (data: ChatData, date: Date): number => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return data.filter((chat) => {
    const chatDate = parseISO(chat.createdAt);
    return chatDate >= start && chatDate <= end;
  }).length;
};

// Function to get average messages per chat
const getAverageMessagesPerChat = (data: ChatData): number => {
  const totalMessages = data.reduce(
    (acc, chat) => acc + chat.messages.length,
    0,
  );
  const average = data.length > 0 ? totalMessages / data.length : 0;
  return parseFloat(average.toFixed(1));
};

// Function to get chats per day
const getChatsPerDay = (data: ChatData): { date: string; chats: number }[] => {
  const chatsByDay: Record<string, number> = {};
  data.forEach((chat) => {
    const date = format(parseISO(chat.createdAt), "yyyy-MM-dd");
    chatsByDay[date] = (chatsByDay[date] || 0) + 1;
  });

  return Object.entries(chatsByDay)
    .map(([date, chats]) => ({ date, chats }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  // get all messages for the chatbotId

  const userId = await requireUserId(request);
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }
  const chats = await getChatsByChatbotId({ chatbotId });
  const isPro = await isProUser(userId);

  return json({ chats, isPro });
};

export default function Analytics() {
  const { chats: data, isPro } = useLoaderData<typeof loader>();

  const {
    totalChats,
    percentChangeTotalChats,
    weeklyChats,
    percentChangeWeeklyChats,
    averageMessagesPerChat,
    percentChangeAverageMessagesPerChat,
    chats,
  } = useMemo(() => {
    const now = new Date();
    const lastWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
    );

    const totalChats = getTotalChats(data);
    const totalChatsCurrentWeek = getWeeklyChats(data, now);
    const totalChatsLastWeek = getWeeklyChats(data, lastWeek);

    const avgMessagesCurrent = getAverageMessagesPerChat(
      data.filter((chat) => {
        const chatDate = new Date(chat.createdAt);
        return chatDate >= lastWeek && chatDate <= now;
      }),
    );

    const avgMessagesLastWeek = getAverageMessagesPerChat(
      data.filter((chat) => {
        const chatDate = new Date(chat.createdAt);
        return (
          chatDate >=
            new Date(
              lastWeek.getFullYear(),
              lastWeek.getMonth(),
              lastWeek.getDate() - 7,
            ) && chatDate < lastWeek
        );
      }),
    );

    return {
      totalChats,
      percentChangeTotalChats: calculatePercentChange(
        totalChatsLastWeek,
        totalChatsCurrentWeek,
      ),
      weeklyChats: totalChatsCurrentWeek,
      percentChangeWeeklyChats: calculatePercentChange(
        totalChatsLastWeek,
        totalChatsCurrentWeek,
      ),
      averageMessagesPerChat: avgMessagesCurrent,
      percentChangeAverageMessagesPerChat: calculatePercentChange(
        avgMessagesLastWeek,
        avgMessagesCurrent,
      ),
      chats: getChatsPerDay(data),
    };
  }, [data]);

  const kpiData = [
    {
      name: "Total chats",
      stat: totalChats,
      change: `${parseFloat(percentChangeTotalChats.toFixed(1))}%`,
      changeType: percentChangeTotalChats > 0 ? "positive" : "negative",
    },
    {
      name: "Weekly chats",
      stat: weeklyChats,
      change: `${parseFloat(percentChangeWeeklyChats.toFixed(1))}%`,
      changeType: percentChangeWeeklyChats > 0 ? "positive" : "negative",
    },
    {
      name: "Average messages per chat",
      stat: averageMessagesPerChat,
      change: `${parseFloat(percentChangeAverageMessagesPerChat.toFixed(1))}%`,
      changeType:
        percentChangeAverageMessagesPerChat > 0 ? "positive" : "negative",
    },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 overflow-y-auto lg:gap-6 lg:p-6">
      {isPro ? (
        <>
          <KPICards data={kpiData} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <LineChartHero data={chats} />
          </div>
        </>
      ) : (
        <Blur />
      )}
    </div>
  );
}

export function KPICards({
  data,
}: {
  data: {
    name: string;
    stat: number;
    change: number;
    changeType: "positive" | "negative";
  }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <Card key={item.name}>
          <div className="flex items-center justify-between">
            <p className="text-tremor-default font-medium text-tremor-content dark:text-dark-tremor-content">
              {item.name}
            </p>
            <span
              className={cn(
                item.changeType === "positive"
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-500 dark:ring-emerald-400/20"
                  : "bg-red-100 text-red-800 ring-red-600/10 dark:bg-red-400/10 dark:text-red-500 dark:ring-red-400/20",
                "inline-flex items-center rounded-tremor-small px-2 py-1 text-tremor-label font-medium ring-1 ring-inset",
              )}
            >
              {item.change}
            </span>
          </div>
          <p className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {item.stat}
          </p>
        </Card>
      ))}
    </div>
  );
}

const dataFormatter = (number) =>
  //   `$${Intl.NumberFormat("us").format(number).toString()}`;
  `${number}`;

export function LineChartHero({
  data,
}: {
  data: {
    date: string;
    chats: number;
  }[];
}) {
  return (
    <Card className="col-span-3">
      <h3 className="text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
        Chats per day
      </h3>
      <LineChart
        className="h-80"
        data={data}
        index="date"
        categories={["chats"]}
        colors={["indigo"]}
        valueFormatter={dataFormatter}
        yAxisWidth={60}
        onValueChange={(v) => console.log(v)}
      />
    </Card>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/analytics`,
  breadcrumb: "analytics",
};
