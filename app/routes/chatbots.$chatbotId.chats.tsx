import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Outlet,
  useBeforeUnload,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ChatsCard from "~/components/chats-card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
import { Prisma } from "@prisma/client";

const LIMIT = 64;
const DATA_OVERSCAN = 8;

const getStartLimit = (
  searchParams: URLSearchParams,
): {
  start: number;
  limit: number;
} => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString()),
});

const getCreatedAt = (searchParams: URLSearchParams): "asc" | "desc" =>
  String(searchParams.get("createdAt")) === "asc" ? "asc" : "desc";

const getStarred = (searchParams: URLSearchParams): "1" | "0" =>
  String(searchParams.get("starred")) === "1" ? "1" : "0";

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
  const starredQuery = starred === "1" ? { starred: true } : {};
  const createdAtQuery = {
    createdAt: (createdAt === "asc" ? "asc" : "desc") as Prisma.SortOrder,
  };

  const [totalItems, items] = await prisma.$transaction([
    prisma.chat.count({
      where: {
        chatbotId,
        ...starredQuery,
      },
    }),
    prisma.chat.findMany({
      where: {
        chatbotId,
        ...starredQuery,
      },
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

const SORT_LABELS = [
  {
    value: "desc",
    label: "Date: New to old",
  },
  {
    value: "asc",
    label: "Date: Old to new",
  },
];

export default function Chats() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const starred: "1" | "0" = getStarred(searchParams);
  const createdAt: "asc" | "desc" = getCreatedAt(searchParams);
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = useState(() => start);

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
        (prev) => {
          prev.set("start", String(neededStart));
          prev.set("limit", LIMIT.toString());
          return prev;
        },
        { replace: true },
      );
    }
  }, [start, neededStart, setSearchParams]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  return (
    <div className="flex flex-col  sm:grid sm:grid-cols-10 h-full overflow-none py-4 sm:py-6">
      <div className="flex flex-col gap-2 sm:col-span-3 h-full sm:border-r overflow-auto">
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
        <div className="flex w-full justify-between items-center flex-wrap md:flex-nowrap gap-2 px-4 sm:px-6">
          <p className="text-muted-foreground text-sm text-nowrap	shrink-0">
            {data?.totalItems} Chats
          </p>
          <Select
            name="createdAt"
            defaultValue={createdAt}
            onValueChange={(value) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("createdAt", value);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="shrink">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_LABELS.map((sort) => (
                <SelectItem
                  key={sort.value}
                  value={sort.value}
                  onClick={(e) => e.stopPropagation()}
                >
                  {sort.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          ref={parentRef}
          data-hydrating-signal
          className="px-4 sm:px-6"
          style={{
            height: `100%`,
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
            {rowVirtualizer.virtualItems.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
      {/* the actual content */}
      <Outlet />
    </div>
  );
}

function EmptyState() {
  const isMobile = useMobileScreen();
  return isMobile ? (
    <InboxIndexMd />
  ) : (
    <p className="text-sm text-muted-foreground self-start w-full">
      This is where you will see all incoming messages from your customers.
    </p>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/chats`,
  breadcrumb: "chats",
};
