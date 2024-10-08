import {
  Fetcher,
  useBeforeUnload,
  useFetchers,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ChatsCard from "~/routes/chatbots.$chatbotId.chats/chats-card";

import { Chat } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useVirtual } from "react-virtual";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EmptyState } from "./empty-state";
import { ItemMeasurer } from "./item-measurer";
import { getCreatedAt } from "./route";

export const LIMIT = 64;
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

const isServerRender = typeof document === "undefined";
// eslint-disable-next-line @typescript-eslint/no-empty-function
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

function useIsHydrating(queryString: string) {
  const [isHydrating] = useState(
    () => !isServerRender && Boolean(document.querySelector(queryString)),
  );
  return isHydrating;
}

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

export default function ChatsList({
  totalItems,
  items,
}: {
  totalItems: number;
  items: (SerializeFrom<Chat> & {
    _count: {
      messages: number;
    };
  })[];
}) {
  const navigation = useNavigation();
  const [total, setTotal] = useState(totalItems);
  const [searchParams, setSearchParams] = useSearchParams();
  const createdAt: "asc" | "desc" = getCreatedAt(searchParams);
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const { start, limit } = getStartLimit(searchParams);

  const [initialStart] = useState(() => start);

  const rowVirtualizer = useVirtual({
    size: total,
    parentRef,
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
    if (neededStart + limit > total) {
      neededStart = total - limit;
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // TODO - fix bugs with react-virtual rerenders

  // get inflight archive
  const fetchers = useFetchers();
  const inflightArchives = fetchers
    .filter(
      (fetcher: Fetcher) =>
        fetcher.formData &&
        fetcher.formData.get("intent") === "archive-chat-thread",
    )
    .map((fetcher: Fetcher) => fetcher.formData?.get("chatId"));

  const newItems = items.filter(
    (item) =>
      !inflightArchives.some((archivedChatId) => archivedChatId === item.id),
  );
  items = newItems;
  totalItems -= inflightArchives.length;

  useEffect(() => {
    setTotal(totalItems - inflightArchives.length);
  }, [inflightArchives]);

  return (
    <>
      <div className="flex w-full justify-between items-center flex-wrap md:flex-nowrap gap-2 px-4">
        <p className="text-muted-foreground text-sm text-nowrap shrink-0">
          {total} Chats
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
          <SelectContent
            ref={(ref) => {
              console.log("ref -", ref);
              if (!ref) return;
              ref.ontouchend = (e) => {
                e.preventDefault();
              };
            }}
          >
            {SORT_LABELS.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        ref={parentRef}
        data-hydrating-signal
        className="px-4"
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
            const item = items[index];

            return (
              <ItemMeasurer
                tagName="div"
                key={virtualRow.index}
                measure={virtualRow.measureRef}
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
              </ItemMeasurer>
            );
          })}
          {rowVirtualizer.virtualItems.length === 0 ? <EmptyState /> : null}
        </div>
      </div>
    </>
  );
}
