import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { updateChatStarredStatus } from "~/models/chat.server";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { Prisma } from "@prisma/client";
import ChatsList, { LIMIT } from "./chats-list";

const getStartLimit = (
  searchParams: URLSearchParams,
): {
  start: number;
  limit: number;
} => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString()),
});

const getStarred = (searchParams: URLSearchParams): "1" | "0" =>
  String(searchParams.get("starred")) === "1" ? "1" : "0";

export const getCreatedAt = (searchParams: URLSearchParams): "asc" | "desc" =>
  String(searchParams.get("createdAt")) === "asc" ? "asc" : "desc";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const searchParams = new URL(request.url).searchParams;
  const starred = getStarred(searchParams);
  const createdAt = getCreatedAt(searchParams);
  const { start, limit } = getStartLimit(new URL(request.url).searchParams);
  const starredQuery = starred === "1" ? { starred: true } : {};
  const createdAtQuery = {
    createdAt: (createdAt === "asc" ? "asc" : "desc") as Prisma.SortOrder,
  };

  // All chats that are not safe deleted - and have some user message
  const WHERE = {
    chatbotId,
    ...starredQuery,
    userId: null,
    deleted: false,
    messages: {
      some: {
        role: "user",
      },
    },
  };

  // TODO - defer this
  const [totalItems, items] = await prisma.$transaction([
    prisma.chat.count({
      where: WHERE,
    }),
    prisma.chat.findMany({
      where: WHERE,
      orderBy: {
        ...createdAtQuery,
      },
      skip: start,
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);
  await requireUserId(request);

  return json({ totalItems, items });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const star = formData.get("star") as string;
  const chatId = formData.get("chatId") as string;

  switch (action) {
    case "star": {
      return await updateChatStarredStatus({
        chatId,
        starred: star === "true",
      });
    }
    default:
      throw new Error("Invalid action");
  }
};

export default function Chats() {
  const { totalItems, items } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const starred: "1" | "0" = getStarred(searchParams);

  // TODO - fix bugs with react-virtual rerenders
  // TODO - defer is not working - throwing server timout, but works on tab switch?

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-10 h-full overflow-none ">
      <div className="flex flex-col h-full gap-2 sm:col-span-3 sm:border-r overflow-auto py-4 sm:py-6">
        <Tabs
          defaultValue={starred}
          className="w-full px-4 sm:px-6"
          onValueChange={(val) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("starred", val);
            setSearchParams(newParams);
          }}
        >
          <TabsList>
            <TabsTrigger value="0">All chats</TabsTrigger>
            <TabsTrigger value="1">Starred</TabsTrigger>
          </TabsList>
        </Tabs>
        <ChatsList totalItems={totalItems} items={items} />
      </div>
      <Outlet />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/chats`,
  breadcrumb: "chats",
};
