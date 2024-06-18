import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useBeforeUnload,
  useSearchParams,
  useNavigation,
  useParams,
  useFetchers,
  Fetcher,
} from "@remix-run/react";
import { DialogDemo } from "./modal";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { Input } from "~/components/ui/input";
import { SearchIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Document, DocumentType } from "@prisma/client";
import { crawlQueue } from "~/queues/crawl.server";
import { scrapeQueue } from "~/queues/scrape.server";
import { parseFileQueue } from "~/queues/parsefile.server";
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
import { queue } from "~/queues/ingestion.server";
import { validateUrl } from "~/utils";

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

      if (!validateUrl(url)) {
        return json(
          { errors: { url: "Url is invalid" }, intent, job: null },
          { status: 400 },
        );
      }

      return json({
        errors: null,
        intent,
        job: await crawlQueue.add("crawl", {
          url,
        }),
      });
    }
    case "scrapeLinks": {
      const urls = JSON.parse(String(formData.get("links")));
      const crawled = formData.get("crawled");
      invariant(Array.isArray(urls), "Links must be an array");

      if (!crawled) {
        invariant(urls.length === 1, "urls must be an array of length 1");
        if (!validateUrl(urls[0])) {
          return json(
            {
              errors: { url: "Url is invalid" },
              intent,
              tress: null,
              documents: null,
            },
            { status: 400 },
          );
        }
      }

      // should do this stuff in validation for user feedback
      invariant(urls.length > 0, "Links must be an array");

      const documents = await prisma.document.createManyAndReturn({
        data: urls.map((url: string) => ({
          name: url,
          url,
          type: DocumentType.WEBSITE,
          chatbotId,
        })),
      });

      const trees = await webFlow({
        documents,
        preprocessingQueue: scrapeQueue,
      });
      return json({ errors: null, intent, trees, documents });
    }
    case "parseFiles": {
      try {
        const response = await fetch("http://localhost:3000/api/upload", {
          method: "POST",
          body: formData,
        });

        const cloudinaryResponse = await response.json();

        if (cloudinaryResponse.error) {
          throw new Error(`Error uploading files: ${cloudinaryResponse.error}`);
        }

        const fileSrcs = cloudinaryResponse.fileSrcs;
        invariant(Array.isArray(fileSrcs), "File srcs must be an array");
        invariant(fileSrcs.length > 0, "File srcs must be an array");

        const documents = await prisma.document.createManyAndReturn({
          data: fileSrcs.map((file: { src: string; name: string }) => ({
            name: file.name,
            filepath: file.src,
            type: DocumentType.FILE,
            chatbotId,
          })),
        });

        const trees = await webFlow({
          documents,
          preprocessingQueue: parseFileQueue,
        });

        return json({ intent, trees, documents });
      } catch (error) {
        throw new Error(`Error uploading files: ${error}`);
      }
    }
    case "blank": {
      const name = String(formData.get("name"));
      const content = String(formData.get("content"));

      const document = await prisma.document.create({
        data: {
          name,
          content,
          chatbotId,
        },
      });

      await queue.add(
        `ingestion-${document.id}`,
        { document },
        { jobId: document.id },
      );

      return json({ intent, documents: [document] });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  const data = useLoaderData<typeof loader>();
  const fetchers = useFetchers();
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
    setProgressStates((prev) => ({
      ...prev,
      [data.queueName]: {
        ...prev[data.queueName],
        [data.documentId]: data,
      },
    }));
  }, [lastCompletedEvent, lastProgressEvent]);

  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    estimateSize: useCallback(() => 142 + 16, []),
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

  // optimistic documents
  if (fetchers.length > 0) {
    fetchers.forEach((fetcher: Fetcher) => {
      let newDocs = [];

      switch (fetcher.formData?.get("intent")) {
        case "parseFiles": {
          const files = JSON.parse(String(fetcher?.formData.getAll("files")));
          newDocs = files.map((file: File) => ({
            name: file.name,
            type: DocumentType.FILE,
            chatbotId,
            createdAt: new Date(),
          }));
          break;
        }
        case "scrapeLinks": {
          const urls = JSON.parse(String(fetcher?.formData.getAll("links")));
          newDocs = urls.map((url: string) => ({
            name: url,
            url,
            type: DocumentType.WEBSITE,
            chatbotId,
            createdAt: new Date(),
          }));
          break;
        }
        case "blank": {
          const name = String(fetcher?.formData.get("name"));
          const content = String(fetcher?.formData.get("content"));
          newDocs = [
            {
              name,
              content,
              chatbotId,
              createdAt: new Date(),
              type: DocumentType.RAW,
            },
          ];
          break;
        }
        default: {
          break;
        }
      }
      data.items = [...data.items, ...newDocs];
      data.totalItems = data.totalItems + newDocs.length;
    });
  }

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

            // problem with queue initialization here
            const preprocessingQueueName =
              item.type === DocumentType.FILE
                ? "parseFile"
                : DocumentType.WEBSITE
                ? "scrape"
                : null;

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size - 16}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item ? (
                  <DocumentCard
                    item={item}
                    ingestionProgress={progressStates["ingestion"]?.[item.id]}
                    preprocessingProgress={
                      progressStates[preprocessingQueueName ?? ""]?.[item.id]
                    }
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
