import {
  useBeforeUnload,
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
import { useVirtual } from "react-virtual";
import { ItemMeasurer } from "../chatbots.$chatbotId.chats/item-measurer";
import { DocumentCard } from "./document-card";
import { OptimisticDocument } from "./route";

// increase both - like @chats-list.tsx
// should probably share all of these common infinite scroll functions with @chats-list.tsx
// or maybe just a modularize infinite scroll component?
export const LIMIT = 64;
const DATA_OVERSCAN = 8;

export const getStartLimit = (searchParams: URLSearchParams) => ({
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

export default function DocumentsList({
  items,
  totalItems,
  searchTerm, // progress,
}: {
  items: OptimisticDocument[];
  totalItems: number;
  searchTerm: string;
  // progress: ProgressData | undefined;
}) {
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = useState(() => start);
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: totalItems,
    parentRef,
    estimateSize: useCallback(() => 142, []),
    initialRect: { width: 0, height: 800 },
  });

  // saving the user's scroll position
  // TODO: change the local storage key
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
    if (neededStart + limit > totalItems) {
      neededStart = totalItems - limit;
    }

    // can't go below 0
    if (neededStart < 0) {
      neededStart = 0;
    }
  }

  const updatePagination = useCallback(
    (newStart: number) => {
      setSearchParams(
        {
          start: String(newStart),
          limit: LIMIT.toString(),
          ...(searchTerm ? { q: searchTerm } : {}),
        },
        { replace: true },
      );
    },
    [setSearchParams, searchTerm],
  );

  useEffect(() => {
    if (isMountedRef.current && neededStart !== start) {
      updatePagination(neededStart);
    }
  }, [neededStart, start, updatePagination]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  return (
    <div
      key={`list-${totalItems}`}
      ref={parentRef}
      data-hydrating-signal
      className="List no-scrollbar"
      style={{
        height: `800px`,
        width: `100%`,
        overflow: "auto",
      }}
    >
      <div
        className="flex flex-col gap-4 flex-1 w-full"
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
                <DocumentCard key={item.id} item={item} />
              ) : navigation.state === "loading" ? (
                <span>Loading...</span>
              ) : (
                <span>Nothing to see here...</span>
              )}
            </ItemMeasurer>
          );
        })}
        {rowVirtualizer.virtualItems.length === 0 && <p>No documents yet</p>}
      </div>
    </div>
  );
}
