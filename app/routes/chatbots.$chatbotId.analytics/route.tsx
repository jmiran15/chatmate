import { LoaderFunctionArgs, json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import KPIs from "./kpis";
import { BarChart2, Clock, ArrowUpRight, MessageSquare } from "lucide-react";
import ChatsChart from "./charts/chats";
import { TagsChart } from "./charts/tags";
import BattleFieldChart from "./charts/faq";
import VisitorsBarlist from "./charts/visitors";
import Sources from "./charts/sources";
import GapsBarlist from "./charts/gaps";

import { prisma } from "~/db.server";
import { Prisma, TicketStatus } from "@prisma/client";

export const loader = async ({
  params,
  request,
}: LoaderFunctionArgs): Promise<Response> => {
  await requireUserId(request);
  const chatbotId = params.chatbotId;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const chatWhereClause = {
    chatbotId,
    deleted: false,
    messages: {
      some: {
        role: "user",
      },
    },
  };

  // Total chats
  const totalChats = await prisma.chat.count({
    where: chatWhereClause,
  });

  // Average resolution time and total time saved
  const timeStats = await prisma.chat.aggregate({
    _avg: { elapsedMs: true },
    _sum: { elapsedMs: true },
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
    },
  });

  // Resolution rate
  const closedChats = await prisma.chat.count({
    where: {
      ...chatWhereClause,
      status: TicketStatus.CLOSED,
    },
  });
  const resolutionRate = totalChats > 0 ? (closedChats / totalChats) * 100 : 0;

  // Fetch distinct labels
  const distinctLabels = await prisma.label.findMany({
    where: {
      chatbot: { id: chatbotId },
    },
    select: { name: true },
    distinct: ["name"],
  });

  const labelNames = distinctLabels.map((label) => label.name);

  // Chats - bar chart with labels
  let chatsByDateAndLabel;

  if (labelNames.length > 0) {
    const labelColumns = labelNames
      .map(
        (name) =>
          `COALESCE(SUM(CASE WHEN l.name = '${name}' THEN 1 ELSE 0 END), 0) AS "${name}"`,
      )
      .join(", ");

    const unlabeledColumn = `COUNT(*) - ${labelNames
      .map(
        (name) =>
          `COALESCE(SUM(CASE WHEN l.name = '${name}' THEN 1 ELSE 0 END), 0)`,
      )
      .join(" - ")}`;

    chatsByDateAndLabel = await prisma.$queryRaw(Prisma.sql`
      SELECT DATE(c."createdAt") as date, 
             COUNT(*) as total,
             ${Prisma.raw(labelColumns)},
             ${Prisma.raw(unlabeledColumn)} as unlabeled
      FROM "Chat" c
      LEFT JOIN "_ChatToLabel" cl ON c.id = cl."A"
      LEFT JOIN "Label" l ON l.id = cl."B"
      WHERE c."chatbotId" = ${chatbotId}
        AND c.deleted = false
        AND EXISTS (SELECT 1 FROM "Message" m WHERE m."chatId" = c.id AND m.role = 'user')
      GROUP BY DATE(c."createdAt")
      ORDER BY DATE(c."createdAt")
    `);
  } else {
    // If there are no labels, just count total chats per day
    chatsByDateAndLabel = await prisma.$queryRaw(Prisma.sql`
      SELECT DATE(c."createdAt") as date, 
             COUNT(*) as total,
             COUNT(*) as unlabeled
      FROM "Chat" c
      WHERE c."chatbotId" = ${chatbotId}
        AND c.deleted = false
        AND EXISTS (SELECT 1 FROM "Message" m WHERE m."chatId" = c.id AND m.role = 'user')
      GROUP BY DATE(c."createdAt")
      ORDER BY DATE(c."createdAt")
    `);
  }

  // Tags - pie chart
  const tagsCount = await prisma.$queryRaw(Prisma.sql`
    SELECT 
      COALESCE(l.name, 'Unlabeled') as label,
      COUNT(DISTINCT c.id) as count
    FROM "Chat" c
    LEFT JOIN "_ChatToLabel" cl ON c.id = cl."A"
    LEFT JOIN "Label" l ON l.id = cl."B"
    WHERE c."chatbotId" = ${chatbotId}
      AND c.deleted = false
      AND EXISTS (SELECT 1 FROM "Message" m WHERE m."chatId" = c.id AND m.role = 'user')
    GROUP BY COALESCE(l.name, 'Unlabeled')
    ORDER BY count DESC
  `);

  console.log("analytics: ", {
    totalChats,
    avgResolutionTime: timeStats._avg.elapsedMs || 0,
    resolutionRate,
    totalTimeSaved: timeStats._sum.elapsedMs || 0,
    chatsByDate: chatsByDateAndLabel,
    tagsCount,
  });

  return json({ success: true });
};

export default function Analytics() {
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
    <div className="h-full w-full overflow-y-auto">
      <div className="max-w-screen-lg flex flex-col gap-4 p-8">
        <KPIs data={kpiData} />
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <ChatsChart />
          <TagsChart />
          <BattleFieldChart />
          <GapsBarlist />
          <Sources />
          <VisitorsBarlist />
        </div>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/analytics`,
  breadcrumb: "analytics",
};
