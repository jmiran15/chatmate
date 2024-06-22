import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Outlet,
  useBeforeUnload,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ChatsCard from "~/components/chats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { updateChatStarredStatus } from "~/models/chat.server";
import { requireUserId } from "~/session.server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useMobileScreen } from "~/utils/mobile";
import InboxIndexMd from "~/components/indexes/inbox-md";
import { prisma } from "~/db.server";
import { useVirtual } from "react-virtual";
import { Button } from "~/components/ui/button";
import { createId } from "@paralleldrive/cuid2";

const LIMIT = 64;
const DATA_OVERSCAN = 8;

const getStartLimit = (searchParams: URLSearchParams) => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString()),
});

const getCreatedAt = (searchParams: URLSearchParams) => ({
  createdAt: String(searchParams.get("createdAt") || "asc"),
});

const getStarred = (searchParams: URLSearchParams) =>
  searchParams.get("starred") || "";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request);
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("chatbotId is required");
  }

  const searchParams = new URL(request.url).searchParams;
  const starred = getStarred(searchParams);
  const createdAt = getCreatedAt(searchParams);

  const { start, limit } = getStartLimit(new URL(request.url).searchParams);

  const where = starred
    ? {
        chatbotId,
        userId: null,
        starred: true,
      }
    : {
        chatbotId,
        userId: null,
      };
  const [totalItems, items] = await prisma.$transaction([
    prisma.chat.count({
      where,
    }),
    prisma.chat.findMany({
      where,
      orderBy: createdAt,
      skip: start,
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);

  return json(
    {
      totalItems,
      items,
    },
    { headers: { "Cache-Control": "public, max-age=120" } },
  );
};

const isServerRender = typeof document === "undefined";
// eslint-disable-next-line @typescript-eslint/no-empty-function
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

function useIsHydrating(queryString: string) {
  const [isHydrating] = useState(
    () => !isServerRender && Boolean(document.querySelector(queryString)),
  );
  return isHydrating;
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const star = formData.get("star") as string;
  const chatId = formData.get("chatId") as string;
  const { chatbotId } = params;

  // if (!chatId) {
  //   throw new Error("chatId is required");
  // }

  switch (action) {
    case "star": {
      return await updateChatStarredStatus({
        chatId,
        starred: star === "true",
      });
    }
    case "seed": {
      if (!chatbotId) {
        throw new Error("chatbotId is required");
      }

      const chatData = Array.from({ length: 100 }, (_, i) => {
        const id_ = createId();
        return {
          id: id_,
          chatbotId,
          name: `Untitled Chat ${i}-${createId()}`,
          aiInsights:
            "this is insight 1, this is insight 2, this is insight 3, this is insight 4",
          sessionId: id_,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const messageData = chatData.flatMap((chat, i) => [
        {
          role: "assistant",
          content: "Hello",
          chatId: chat.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          role: "user",
          content: "Hi",
          chatId: chat.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      return await prisma.$transaction(async (prisma) => {
        await prisma.chat.createMany({
          data: chatData,
        });

        await prisma.message.createMany({
          data: messageData,
        });
      });
    }

    default:
      throw new Error("Invalid action");
  }
};

const SORT_LABELS = [
  {
    value: "dateNewToOld",
    label: "Date: New to old",
  },
  {
    value: "dateOldToNew",
    label: "Date: Old to new",
  },
];

export default function Chats() {
  let data = useLoaderData<typeof loader>();

  const [tab, setTab] = useState<"all" | "starred">("all");
  const [sort, setSort] = useState<
    "dateNewToOld" | "dateOldToNew" | "messagesHighToLow" | "messagesLowToHigh"
  >("dateNewToOld");

  // infinite scroll
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { start, limit } = getStartLimit(searchParams);

  // initiliazing with the function is somehow more efficient - because it is only called once
  const [initialStart] = useState(() => start);
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    // change estimated size ...
    estimateSize: useCallback(() => 50, []),
    initialRect: { width: 0, height: 800 },
  });

  // saving the user's scroll position
  useBeforeUnload(
    useCallback(() => {
      if (!parentRef.current) return;
      sessionStorage.setItem(
        "infiniteScrollTop",
        parentRef.current.scrollTop.toString(),
      );
    }, []),
  );

  // hydrating the scroll position
  useSSRLayoutEffect(() => {
    if (!hydrating) return;
    if (!parentRef.current) return;

    const infiniteScrollTop = sessionStorage.getItem("infiniteScrollTop");
    if (!infiniteScrollTop) return;

    parentRef.current.scrollTop = Number(infiniteScrollTop);

    return () => {
      sessionStorage.removeItem("infiniteScrollTop");
    };
  }, [initialStart, hydrating]);

  const lowerBoundary = start + DATA_OVERSCAN;
  const upperBoundary = start + limit - DATA_OVERSCAN;
  const middleCount = Math.ceil(limit / 2);

  const [firstVirtualItem] = rowVirtualizer.virtualItems;
  const [lastVirtualItem] = [...rowVirtualizer.virtualItems].reverse();

  let neededStart = start;

  if (!firstVirtualItem || !lastVirtualItem) {
    // throw new Error("this should never happen");
    neededStart = 0;
  } else {
    if (firstVirtualItem?.index < lowerBoundary) {
      // user is scrolling up. Move the window up
      neededStart =
        Math.floor((firstVirtualItem?.index - middleCount) / DATA_OVERSCAN) *
        DATA_OVERSCAN;
    } else if (lastVirtualItem?.index > upperBoundary) {
      // user is scrolling down. Move the window down
      neededStart =
        Math.ceil((lastVirtualItem?.index - middleCount) / DATA_OVERSCAN) *
        DATA_OVERSCAN;
    }

    // can't go above our data
    if (neededStart + limit > data.totalItems) {
      neededStart = data.totalItems - limit;
    }

    // can't go below 0
    if (neededStart < 0) {
      neededStart = 0;
    }
  }

  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }
    if (neededStart !== start) {
      setSearchParams(
        {
          start: String(neededStart),
          limit: LIMIT.toString(),
        },
        { replace: true },
      );
    }
  }, [start, neededStart, setSearchParams]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const fetcher = useFetcher();
  // const isMobile = useMobileScreen();

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-10 h-full overflow-none ">
      {/* need to keep this in sync with the searchParams - Remix should how to do
        it in one of their guides */}

      {/* <div> */}
      {/* <Tabs
          value={tab}
          className="w-full"
          onValueChange={(value: "all" | "starred") => {
            setTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All chats</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
          </TabsList>
          <div className="flex w-full justify-between items-center my-4 flex-wrap md:flex-nowrap gap-2">
            <p className="text-muted-foreground text-sm text-nowrap	shrink-0">
              Showing {chatsState.length} of {totalChatsCount} chats
            </p>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="shrink">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_LABELS.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsContent value="all">
            {chatsState.length === 0 ? (
              isMobile ? (
                <InboxIndexMd />
              ) : (
                <p className="text-sm text-muted-foreground self-start w-full">
                  This is where you will see all incoming messages from your
                  customers.
                </p>
              )
            ) : (
              <ol className="w-full space-y-4">
                {chatsState.map((chat) => (
                  <li key={chat.id}>
                    <ChatsCard chat={chat} />
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
          <TabsContent value="starred">
            {chatsState.length === 0 ? (
              isMobile ? (
                <InboxIndexMd />
              ) : (
                <p className="text-sm text-muted-foreground self-start w-full">
                  No starred chats
                </p>
              )
            ) : (
              <ol className="w-full space-y-4">
                {chatsState.map((chat) => (
                  <li key={chat.id}>
                    <ChatsCard chat={chat} />
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs> */}
      {/* the tabs */}
      {/* the filters */}
      {/* the list of chats */}
      <div
        ref={parentRef}
        data-hydrating-signal
        // className="flex flex-col h-full w-full items-center justify-start p-4 gap-4 sm:border-r sm:p-6 sm:col-span-3 bg-red-100 overflow-auto"

        className="col-span-3 bg-red-100 p-4 h-full"
        style={{
          width: `100%`,
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const index = isMountedRef.current
              ? Math.abs(start - virtualRow.index)
              : virtualRow.index;
            const item = data.items[index];

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualRow.measureRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item ? (
                  <ChatsCard chat={item} />
                ) : navigation.state === "loading" ? (
                  <span>Loading...</span>
                ) : (
                  <span>Nothing to see here...</span>
                )}
              </div>
            );
          })}
          {rowVirtualizer.virtualItems.length === 0 && <p>No documents yet</p>}
        </div>
      </div>
      {/* </div> */}
      {/* the actual content */}
      <Outlet />
    </div>
  );
}
export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/chats`,
  breadcrumb: "chats",
};
