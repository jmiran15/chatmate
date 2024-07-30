import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { Prisma, TicketStatus } from "@prisma/client";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import { DateTime, Duration } from "luxon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import ChatsChart from "./charts/chats";
import KPIs from "./kpis";
import { MessageSquare } from "lucide-react";
import { TagsChart } from "./charts/tags";
import VisitorsBarlist from "./charts/visitors";
import { faker } from "@faker-js/faker";

const DATE_RANGES = [
  { label: "Last hour", value: "1hr" },
  { label: "Last 24 hours", value: "24hr" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 12 months", value: "12m" },
];

const getPeriodFilter = (searchParams: URLSearchParams) => {
  const period = searchParams.get("period") || "30d";
  const now = DateTime.now().setZone("utc");

  switch (period) {
    case "1hr":
      return now.minus({ hours: 1 });
    case "24hr":
      return now.minus({ days: 1 });
    case "7d":
      return now.minus({ days: 7 });
    case "30d":
      return now.minus({ days: 30 });
    case "6m":
      return now.minus({ months: 6 });
    case "12m":
      return now.minus({ months: 12 });
    default:
      return now.minus({ days: 30 });
  }
};

export const loader = async ({
  params,
  request,
}: LoaderFunctionArgs): Promise<Response> => {
  await requireUserId(request);
  const chatbotId = params.chatbotId;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const searchParams = new URL(request.url).searchParams;
  const period = searchParams.get("period") || "30d";
  const currentStartDate = getPeriodFilter(searchParams).toJSDate();
  const now = DateTime.now().setZone("utc").toJSDate();
  const previousStartDate = getPeriodFilter(
    new URLSearchParams(`period=${period}`),
  )
    .minus({
      [period.slice(-1) === "d" ? "days" : "months"]: parseInt(
        period.slice(0, -1),
      ),
    })
    .toJSDate();

  const chatWhereClause = {
    chatbotId,
    deleted: false,
    messages: {
      some: {
        role: "user",
      },
    },
  };

  // Current period data
  const totalChats = await prisma.chat.count({
    where: {
      ...chatWhereClause,
      createdAt: { gte: currentStartDate, lte: now },
    },
  });

  const timeStats = await prisma.chat.aggregate({
    _avg: { elapsedMs: true },
    _sum: { elapsedMs: true },
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
      createdAt: { gte: currentStartDate, lte: now },
    },
  });

  const closedChats = await prisma.chat.count({
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
      createdAt: { gte: currentStartDate, lte: now },
    },
  });

  // Previous period data
  const previousTotalChats = await prisma.chat.count({
    where: {
      ...chatWhereClause,
      createdAt: { gte: previousStartDate, lt: currentStartDate },
    },
  });

  const previousTimeStats = await prisma.chat.aggregate({
    _avg: { elapsedMs: true },
    _sum: { elapsedMs: true },
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
      createdAt: { gte: previousStartDate, lt: currentStartDate },
    },
  });

  const previousClosedChats = await prisma.chat.count({
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
      createdAt: { gte: previousStartDate, lt: currentStartDate },
    },
  });

  const resolutionRate = totalChats > 0 ? (closedChats / totalChats) * 100 : 0;
  const previousResolutionRate =
    previousTotalChats > 0
      ? (previousClosedChats / previousTotalChats) * 100
      : 0;

  // Fetch distinct labels
  const distinctLabels = await prisma.label.findMany({
    where: {
      chatbot: { id: chatbotId },
    },
    select: { name: true, color: true },
    distinct: ["name"],
  });

  const labelNames = distinctLabels.map((label) => label.name);

  // Tags - pie chart
  const tagsCount = await prisma.$queryRaw(Prisma.sql`
   SELECT 
     COALESCE(l.name, 'Unlabeled') as label,
     COUNT(DISTINCT c.id)::integer as count
   FROM "Chat" c
   LEFT JOIN "_ChatToLabel" cl ON c.id = cl."A"
   LEFT JOIN "Label" l ON l.id = cl."B"
   WHERE c."chatbotId" = ${chatbotId}
     AND c.deleted = false
     AND c."createdAt" >= ${currentStartDate}::timestamp AT TIME ZONE 'UTC'
     AND c."createdAt" <= ${now}::timestamp AT TIME ZONE 'UTC'
     AND EXISTS (SELECT 1 FROM "Message" m WHERE m."chatId" = c.id AND m.role = 'user')
   GROUP BY COALESCE(l.name, 'Unlabeled')
   ORDER BY count DESC
 `);

  // Total chat counts by day
  const chatCountsByDay = await prisma.$queryRaw<
    {
      date: Date;
      chats: number;
    }[]
  >(
    Prisma.sql`
  SELECT 
    DATE(c."createdAt" AT TIME ZONE 'UTC') as date,
    COUNT(*)::integer as chats
  FROM "Chat" c
  WHERE c."chatbotId" = ${chatbotId}
    AND c.deleted = false
    AND c."createdAt" >= ${currentStartDate}::timestamp AT TIME ZONE 'UTC'
    AND c."createdAt" <= ${now}::timestamp AT TIME ZONE 'UTC'
    AND EXISTS (SELECT 1 FROM "Message" m WHERE m."chatId" = c.id AND m.role = 'user')
  GROUP BY DATE(c."createdAt" AT TIME ZONE 'UTC')
  ORDER BY DATE(c."createdAt" AT TIME ZONE 'UTC')
`,
  );

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number) =>
    previous !== 0 ? ((current - previous) / previous) * 100 : 0;

  // New queries for anonymous user data
  const countryData = await prisma.$queryRaw<
    {
      country: string;
      country_code: string;
      count: number;
    }[]
  >(
    Prisma.sql`
    SELECT 
      au.country,
      au.country_code,
      COUNT(*)::integer as count
    FROM "AnonymousUser" au
    JOIN "Chat" c ON au."chatId" = c.id
    WHERE c."chatbotId" = ${chatbotId}
      AND c."createdAt" >= ${currentStartDate}::timestamp AT TIME ZONE 'UTC'
      AND c."createdAt" <= ${now}::timestamp AT TIME ZONE 'UTC'
    GROUP BY au.country, au.country_code
    ORDER BY count DESC
  `,
  );

  const browserData = await prisma.$queryRaw<
    {
      browser: string;
      count: number;
    }[]
  >`
    SELECT 
      au.browser_name as browser,
      COUNT(*)::integer as count
    FROM "AnonymousUser" au
    JOIN "Chat" c ON au."chatId" = c.id
    WHERE c."chatbotId" = ${chatbotId}
      AND c."createdAt" >= ${currentStartDate}::timestamp AT TIME ZONE 'UTC'
      AND c."createdAt" <= ${now}::timestamp AT TIME ZONE 'UTC'
    GROUP BY au.browser_name
    ORDER BY count DESC
  `;

  const deviceData = await prisma.$queryRaw<
    {
      device: string;
      count: number;
    }[]
  >`
    SELECT 
      au.device_type as device,
      COUNT(*)::integer as count
    FROM "AnonymousUser" au
    JOIN "Chat" c ON au."chatId" = c.id
    WHERE c."chatbotId" = ${chatbotId}
      AND c."createdAt" >= ${currentStartDate}::timestamp AT TIME ZONE 'UTC'
      AND c."createdAt" <= ${now}::timestamp AT TIME ZONE 'UTC'
    GROUP BY au.device_type
    ORDER BY count DESC
  `;

  return json({
    totalChats,
    avgResolutionTime: timeStats._avg.elapsedMs || 0,
    resolutionRate,
    totalTimeSaved: timeStats._sum.elapsedMs || 0,
    tagsCount,
    chatCountsByDay,
    labelNames,
    period,
    previousPeriod: {
      totalChats: previousTotalChats,
      avgResolutionTime: previousTimeStats._avg.elapsedMs || 0,
      resolutionRate: previousResolutionRate,
      totalTimeSaved: previousTimeStats._sum.elapsedMs || 0,
    },
    percentageChanges: {
      totalChats: calculatePercentageChange(totalChats, previousTotalChats),
      avgResolutionTime: calculatePercentageChange(
        timeStats._avg.elapsedMs || 0,
        previousTimeStats._avg.elapsedMs || 0,
      ),
      resolutionRate: calculatePercentageChange(
        resolutionRate,
        previousResolutionRate,
      ),
      totalTimeSaved: calculatePercentageChange(
        timeStats._sum.elapsedMs || 0,
        previousTimeStats._sum.elapsedMs || 0,
      ),
    },
    countryData,
    browserData,
    deviceData,
    distinctLabels,
  });
};

const generateRandomDate = (start: DateTime, end: DateTime) => {
  return DateTime.fromMillis(
    start.toMillis() + Math.random() * (end.toMillis() - start.toMillis()),
  );
};

const generateRandomMessages = (count: number) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i + 1} content`,
    });
  }
  return messages;
};

const seedChats = async (chatbotId: string) => {
  const now = DateTime.now().setZone("utc");
  const oneYearAgo = now.minus({ months: 12 });

  const labels = await prisma.label.findMany({
    where: { chatbotId },
    select: { id: true },
  });

  for (let i = 0; i < 100; i++) {
    const createdAt = generateRandomDate(oneYearAgo, now);
    const messageCount = Math.floor(Math.random() * 10) + 1;
    const status =
      Math.random() > 0.5 ? TicketStatus.OPEN : TicketStatus.CLOSED;
    const elapsedMs = Math.floor(Math.random() * 300000);

    const chatLabels = labels
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3));

    const chat = await prisma.chat.create({
      data: {
        chatbotId,
        createdAt: createdAt.toUTC().toJSDate(),
        updatedAt: createdAt.toUTC().toJSDate(),
        deleted: false,
        seen: Math.random() > 0.5,
        status,
        elapsedMs,
        messages: {
          create: generateRandomMessages(messageCount),
        },
        labels: {
          connect: chatLabels.map((label) => ({ id: label.id })),
        },
      },
    });

    // Create anonymous user data for each chat
    await prisma.anonymousUser.create({
      data: {
        sessionId: faker.datatype.uuid(),
        chatId: chat.id,
        ip: faker.internet.ip(),
        country: faker.address.country(),
        country_code: faker.address.countryCode(),
        city: faker.address.city(),
        browser_name: faker.helpers.arrayElement([
          "Chrome",
          "Firefox",
          "Safari",
          "Edge",
        ]),
        browser_version: faker.system.semver(),
        device_type: faker.helpers.arrayElement([
          "desktop",
          "mobile",
          "tablet",
        ]),
        os_name: faker.helpers.arrayElement([
          "Windows",
          "MacOS",
          "Linux",
          "iOS",
          "Android",
        ]),
      },
    });
  }
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "seed") {
    await seedChats(chatbotId);
    return { success: true, message: "Chats seeded successfully" };
  }

  return { success: false, message: "Invalid action" };
};

const formatDuration = (milliseconds: number) => {
  const duration = Duration.fromMillis(milliseconds);
  const days = Math.floor(duration.as("days"));
  const hours = Math.floor(duration.as("hours") % 24);
  const minutes = Math.floor(duration.as("minutes") % 60);
  const seconds = Math.floor(duration.as("seconds") % 60);

  let formatted = "";
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}hr `;
  if (minutes > 0) formatted += `${minutes}m `;
  if (seconds > 0 || formatted === "") formatted += `${seconds}s`;

  return formatted.trim();
};

export default function Analytics() {
  const {
    totalChats,
    avgResolutionTime,
    resolutionRate,
    totalTimeSaved,
    tagsCount,
    chatCountsByDay,
    // labelNames,
    period,
    // previousPeriod,
    percentageChanges,
    countryData,
    browserData,
    deviceData,
    distinctLabels,
  } = useLoaderData<typeof loader>();

  const submit = useSubmit();
  const [searchParams] = useSearchParams();

  const handlePeriodChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("period", value);
    submit(newSearchParams, { replace: true, method: "get" });
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-screen-lg flex flex-col gap-4 p-8">
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {DATE_RANGES.map((range) => (
              <SelectItem
                key={range.value}
                value={range.value}
                className="rounded-lg"
              >
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <KPIs
          data={[
            {
              name: "Total chats",
              stat: totalChats,
              change: Math.abs(percentageChanges.totalChats).toFixed(1),
              changeType:
                percentageChanges.totalChats > 0 ? "positive" : "negative",
              icon: MessageSquare,
            },
            {
              name: "Resolution time",
              stat: formatDuration(avgResolutionTime),
              change: Math.abs(percentageChanges.avgResolutionTime).toFixed(1),
              changeType:
                percentageChanges.avgResolutionTime > 0
                  ? "negative"
                  : "positive",
              icon: MessageSquare,
            },
            {
              name: "Resolution rate",
              stat: Math.round(resolutionRate) + "%",
              change: Math.abs(percentageChanges.resolutionRate).toFixed(1),
              changeType:
                percentageChanges.resolutionRate > 0 ? "positive" : "negative",
              icon: MessageSquare,
            },
            {
              name: "Time saved",
              stat: formatDuration(totalTimeSaved),
              change: Math.abs(percentageChanges.totalTimeSaved).toFixed(1),
              changeType:
                percentageChanges.totalTimeSaved > 0 ? "positive" : "negative",
              icon: MessageSquare,
            },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <ChatsChart
            chats={chatCountsByDay}
            period={period}
            percentageChanges={percentageChanges}
          />
          <TagsChart tags={tagsCount} labels={distinctLabels} />
          <VisitorsBarlist
            countryData={countryData}
            browserData={browserData}
            deviceData={deviceData}
          />
        </div>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/analytics`,
  breadcrumb: "analytics",
};
