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
import KPIs from "./kpis";
import {
  BarChart2,
  Users,
  Clock,
  ArrowUpRight,
  MessageSquareDot,
  MessageSquare,
} from "lucide-react";
import ChatsChart from "./charts/chats";
import { TagsChart } from "./charts/tags";
import BarListExample, { FAQBarlist } from "./charts/faq";

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

  // const kpiData = [
  //   {
  //     name: "Total chats",
  //     stat: totalChats,
  //     change: `${parseFloat(percentChangeTotalChats.toFixed(1))}%`,
  //     changeType: percentChangeTotalChats > 0 ? "positive" : "negative",
  //   },
  //   {
  //     name: "Weekly chats",
  //     stat: weeklyChats,
  //     change: `${parseFloat(percentChangeWeeklyChats.toFixed(1))}%`,
  //     changeType: percentChangeWeeklyChats > 0 ? "positive" : "negative",
  //   },
  //   {
  //     name: "Average messages per chat",
  //     stat: averageMessagesPerChat,
  //     change: `${parseFloat(percentChangeAverageMessagesPerChat.toFixed(1))}%`,
  //     changeType:
  //       percentChangeAverageMessagesPerChat > 0 ? "positive" : "negative",
  //   },
  // ];

  const kpiData = [
    {
      name: "Total chats",
      stat: "1,869",
      change: 40,
      changeType: "negative",
      icon: MessageSquare,
    },
    {
      name: "Resolution time",
      stat: "5m 19s",
      change: 5,
      changeType: "negative",
      icon: BarChart2,
    },
    {
      name: "Resolution rate",
      stat: "89%",
      change: 1,
      changeType: "positive",
      icon: Clock,
    },
    {
      name: "Time saved",
      stat: "2h 13m",
      change: 4,
      changeType: "negative",
      icon: ArrowUpRight,
    },
  ];
  return (
    <div className="h-full max-w-5xl flex flex-col gap-4 p-4 overflow-y-auto lg:gap-6 lg:p-6">
      <KPIs data={kpiData} />

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <ChatsChart />
        {/* <TagsChart />
        <BarListExample />
        <BarListExample />
        <BarListExample />
        <BarListExample /> */}
      </div>

      {/* <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <LineChartHero data={chats} />
      </div> */}
    </div>
  );
}

const dataFormatter = (number) =>
  //   `$${Intl.NumberFormat("us").format(number).toString()}`;
  `${number}`;

// export function LineChartHero({
//   data,
// }: {
//   data: {
//     date: string;
//     chats: number;
//   }[];
// }) {
//   return (
//     <Card className="col-span-3">
//       <h3 className="text-lg font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
//         Chats per day
//       </h3>
//       <LineChart
//         className="h-80"
//         data={data}
//         index="date"
//         categories={["chats"]}
//         colors={["indigo"]}
//         valueFormatter={dataFormatter}
//         yAxisWidth={60}
//         onValueChange={(v) => console.log(v)}
//       />
//     </Card>
//   );
// }

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/analytics`,
  breadcrumb: "analytics",
};
