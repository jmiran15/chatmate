import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useBeforeUnload,
  useSearchParams,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { convertUploadedFilesToDocuments } from "~/utils/llm/openai";
import { FullDocument } from "~/utils/types";
import { DialogDemo } from "./modal";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { Input } from "~/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Document, DocumentType } from "@prisma/client";
import { crawlQueue } from "~/queues/crawl.server";
import invariant from "tiny-invariant";
import { webFlow } from "./flows.server";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useVirtual } from "react-virtual";
import { useEventSource } from "remix-utils/sse/react";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import { DocumentCard } from "./document-card";

const LIMIT = 20;
const DATA_OVERSCAN = 4;

const getStartLimit = (searchParams: URLSearchParams) => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString()),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { chatbotId } = params;
  const userId = await requireUserId(request);

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
  });

  if (chatbot?.userId !== userId) {
    throw new Error("User does not have access to chatbot");
  }

  const { start, limit } = getStartLimit(new URL(request.url).searchParams);

  // we should probably do some caching with localforage here - especially for search

  const [totalItems, items] = await prisma.$transaction([
    prisma.document.count({
      where: { chatbotId },
    }),
    prisma.document.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      skip: start,
      take: limit,
    }),
  ]);

  return json(
    {
      items,
      totalItems,
    },
    { headers: { "Cache-Control": "public, max-age=120" } },
  );
};

const isServerRender = typeof document === "undefined";
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

function useIsHydrating(queryString: string) {
  const [isHydrating] = useState(
    () => !isServerRender && Boolean(document.querySelector(queryString)),
  );
  return isHydrating;
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const { chatbotId } = params;

  if (!chatbotId) {
    throw new Error("Chatbot id is required");
  }

  switch (intent) {
    case "getLinks": {
      const url = String(formData.get("url"));

      // return the job, so that we can get job.id and watch it for progress in the table
      return json({
        intent,
        job: await crawlQueue.add("crawl", {
          url,
        }),
      });
    }
    case "scrapeLinks": {
      const urls = JSON.parse(String(formData.get("links")));
      invariant(Array.isArray(urls), "Links must be an array");
      invariant(urls.length > 0, "Links must be an array");

      const documents = await prisma.document.createManyAndReturn({
        data: urls.map((url: string) => ({
          name: url,
          url,
          type: DocumentType.WEBSITE,
          chatbotId,
        })),
      });

      const trees = await webFlow({ documents });
      return json({ intent, trees, documents });
    }
    case "parseFiles": {
      // enqueue the parseFile job - return the job id

      // we need to push the files to cloudinary first - then send the url to the job
      // batch send jobs - for each file url

      // const jobId = await queue.add("parseFile", {
      //   files: formData.getAll("files"),
      // });

      // return json({ intent, jobId });

      // do same parallel stuff that we do in the scrapeLinks action

      // Get all file entries from the original formData
      const files = formData.getAll("files");

      const documents: FullDocument[] =
        await convertUploadedFilesToDocuments(files);

      return json({ intent, documents });
    }

    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  const data = useLoaderData<typeof loader>();
  const { chatbotId } = useParams();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = useState(() => start);
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const [progressStates, setProgressStates] = useState<
    Record<string, Record<Document["id"], ProgressData>>
  >({});

  const lastCompletedEvent = useEventSource(
    `/api/chatbot/${chatbotId}/data/progress`,
    {
      event: "completed",
    },
  );
  const lastProgressEvent = useEventSource(
    `/api/chatbot/${chatbotId}/data/progress`,
    {
      event: "progress",
    },
  );

  useEffect(() => {
    const data: ProgressData = lastCompletedEvent
      ? JSON.parse(lastCompletedEvent)
      : lastProgressEvent
      ? JSON.parse(lastProgressEvent)
      : null;

    if (!data) return;
    console.log("data - ", data);
    setProgressStates((prev) => ({
      ...prev,
      [data.queueName]: {
        ...prev[data.queueName],
        [data.documentId]: data,
      },
    }));
  }, [lastCompletedEvent, lastProgressEvent]);

  console.log("progress state: ", progressStates);

  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    estimateSize: useCallback(() => 200, []),
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
  if (!firstVirtualItem || !lastVirtualItem) {
    throw new Error("this should never happen");
  }

  let neededStart = start;

  if (firstVirtualItem.index < lowerBoundary) {
    // user is scrolling up. Move the window up
    neededStart =
      Math.floor((firstVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  } else if (lastVirtualItem.index > upperBoundary) {
    // user is scrolling down. Move the window down
    neededStart =
      Math.ceil((lastVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  }

  // can't go below 0
  if (neededStart < 0) {
    neededStart = 0;
  }

  // can't go above our data
  if (neededStart + limit > data.totalItems) {
    neededStart = data.totalItems - limit;
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

  return (
    <div className="flex flex-col p-4 gap-8 w-full h-full overflow-y-auto">
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">Data</h1>
          <h1 className="text-sm text-muted-foreground">
            This is the data that your chatbot will be able to reference in it's
            responses
          </h1>
        </div>
        <DialogDemo />
      </div>
      <div className="flex flex-row items-center gap-2">
        <Input type="text" placeholder="Search" />
        <Button className="flex flex-row items-center gap-2">
          <SearchIcon className="w-4 h-4" />
          Search
        </Button>
      </div>
      <div
        ref={parentRef}
        data-hydrating-signal
        className="List"
        style={{
          height: `800px`,
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
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item ? (
                  <DocumentCard
                    item={item}
                    ingestionProgress={progressStates["ingestion"]?.[item.id]}
                    preprocessingProgress={progressStates["scrape"]?.[item.id]}
                  />
                ) : navigation.state === "loading" ? (
                  <span>Loading...</span>
                ) : (
                  <span>Nothing to see here...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};

// memoize the card content, dependent on that item in progress state
// (i.e. if the component never changes progress, its element in progress state will always be null)
// so the values will never recalculate

// we need to memo the component, so that it doesnt rerender when its props dont change?
