import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  useLoaderData,
  useBeforeUnload,
  useSearchParams,
  useNavigation,
  useParams,
  useSubmit,
  useActionData,
} from "@remix-run/react";
import { DialogDemo } from "./modal";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { DocumentType } from "@prisma/client";
import { crawlQueue } from "~/queues/crawl.server";
import { scrapeQueue } from "~/queues/scrape.server";
import { parseFileQueue } from "~/queues/parsefile.server";
import invariant from "tiny-invariant";
import { webFlow } from "./flows.server";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtual } from "react-virtual";
import { useEventSource } from "remix-utils/sse/react";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import { DocumentCard } from "./document-card";
import { queue } from "~/queues/ingestion.server";
import { validateUrl } from "~/utils";
import { usePendingDocuments } from "./hooks/use-pending-documents";
import { deleteDocumentById } from "~/models/document.server";
import { useToast } from "~/components/ui/use-toast";
import { ItemMeasurer } from "../chatbots.$chatbotId.chats/item-measurer";
import { searchDocuments, getDocuments } from "./documents.server";
import { LRUCache } from "lru-cache";
import debounce from "lodash.debounce";
import { invalidateIndex } from "./documents.server";
import { Input } from "~/components/ui/input";

const LIMIT = 20;
const DATA_OVERSCAN = 4;

const getStartLimit = (searchParams: URLSearchParams) => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString()),
});

export const searchCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
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

  const url = new URL(request.url);
  const { start, limit } = getStartLimit(url.searchParams);
  const query = url.searchParams.get("q");

  const cacheKey = `${chatbotId}:${query || ""}:${start}:${limit}`;
  const cachedResult = searchCache.get(cacheKey);

  if (cachedResult) {
    console.log(`Cache hit for ${cacheKey}`);
    return json(cachedResult);
  }

  console.log(`Cache miss for ${cacheKey}`);

  let items, totalItems, searchResults;

  try {
    if (query) {
      const searchResult = await searchDocuments(
        chatbotId,
        query,
        start,
        limit,
      );
      items = searchResult.items;
      totalItems = searchResult.totalItems;
      searchResults = searchResult.searchResults;
    } else {
      const result = await getDocuments(chatbotId, start, limit);
      items = result.items;
      totalItems = result.totalItems;
    }

    const result = { items, totalItems, query, searchResults };
    searchCache.set(cacheKey, result);

    return json(result);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return json(
      {
        items: [],
        totalItems: 0,
        query,
        error: "An error occurred while fetching documents.",
      },
      { status: 500 },
    );
  }
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
        if (!validateUrl(urls[0].url)) {
          return json(
            {
              errors: { url: "Url is invalid" },
              intent,
              trees: null,
              documents: null,
            },
            { status: 400 },
          );
        }
      }

      // should do this stuff in validation for user feedback
      invariant(urls.length > 0, "Links must be an array");

      const documents = await prisma.document.createManyAndReturn({
        data: urls.map((el: { id: string; url: string }) => ({
          id: el.id,
          name: el.url,
          url: el.url,
          type: DocumentType.WEBSITE,
          chatbotId,
        })),
      });

      // Invalidate the index after creating new documents
      invalidateIndex(chatbotId);

      const trees = await webFlow({
        documents,
        preprocessingQueue: scrapeQueue,
      });
      return json({ errors: null, intent, trees, documents });
    }
    case "parseFiles": {
      try {
        const isDev = process.env.NODE_ENV === "development";
        const BASE_URL = isDev ? process.env.DEV_BASE : process.env.PROD_BASE;

        const response = await fetch(`${BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const cloudinaryResponse = await response.json();

        if (cloudinaryResponse.error) {
          throw new Error(`Error uploading files: ${cloudinaryResponse.error}`);
        }

        const fileSrcs = cloudinaryResponse.fileSrcs;
        const fileIds = cloudinaryResponse.fileIds;

        invariant(Array.isArray(fileSrcs), "File srcs must be an array");
        invariant(fileSrcs.length > 0, "File srcs must be an array");

        const documents = await prisma.document.createManyAndReturn({
          data: fileSrcs.map((file: { src: string; name: string }) => ({
            id: fileIds[file.name],
            name: file.name,
            filepath: file.src,
            type: DocumentType.FILE,
            chatbotId,
          })),
        });

        // Invalidate the index after creating new documents
        invalidateIndex(chatbotId);

        const trees = await webFlow({
          documents,
          preprocessingQueue: parseFileQueue,
        });

        return json({ intent, trees, documents });
      } catch (error) {
        console.error("Error uploading files: ", error);
        throw new Error(`Error uploading files: ${error}`);
      }
    }

    case "blank": {
      const name = String(formData.get("name"));
      const content = String(formData.get("content"));
      const id = String(formData.get("documentId"));

      const document = await prisma.document.create({
        data: {
          id,
          name,
          content,
          chatbotId,
        },
      });

      console.log(`Invalidating cache for chatbot ${chatbotId}`);
      invalidateIndex(chatbotId);

      await queue.add(
        `ingestion-${document.id}`,
        { document },
        { jobId: document.id },
      );

      return json({ intent, documents: [document] });
    }
    case "reset": {
      return null;
    }
    case "delete": {
      const documentId = String(formData.get("documentId"));
      const deletedDocument = await deleteDocumentById({ id: documentId });

      // Invalidate the index after deleting a document
      if (deletedDocument) {
        invalidateIndex(deletedDocument.chatbotId);
      }

      return json({
        intent: "delete",
        document: deletedDocument,
      });
    }
    default: {
      return json({ error: "Invalid action" }, { status: 400 });
    }
  }
};

export default function Data() {
  let data = useLoaderData<typeof loader>();
  const { toast } = useToast();
  const [totalItems, setTotalItems] = useState(data.totalItems);
  const [searchTerm, setSearchTerm] = useState(data.query || "");
  const { chatbotId } = useParams();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = useState(() => start);
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  const progress: ProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);

  const rowVirtualizer = useVirtual({
    size: totalItems,
    parentRef,
    estimateSize: useCallback(() => 142, []),
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
    if (neededStart !== start || searchTerm !== data.query) {
      setSearchParams(
        {
          start: String(neededStart),
          limit: LIMIT.toString(),
          ...(searchTerm ? { q: searchTerm } : {}),
        },
        { replace: true },
      );
    }
  }, [start, neededStart, setSearchParams, searchTerm, data.query]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchParams(
        {
          start: String(neededStart),
          limit: LIMIT.toString(),
          ...(term ? { q: term } : {}),
        },
        { replace: true },
      );
    }, 300),
    [setSearchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // optimistic documents

  // on slow networks, the last document gets cut off the virtual list
  const pendingDocuments = usePendingDocuments();
  const updatedData = useMemo(() => {
    const newData = { ...data };
    newData.items = [...pendingDocuments, ...data.items];
    newData.totalItems = data.totalItems + pendingDocuments.length;
    return newData;
  }, [data, pendingDocuments]);

  data = updatedData;

  console.log("pendingDocuments", { pendingDocuments, data });

  useEffect(() => {
    setTotalItems(data.totalItems);
  }, [data.totalItems]);

  useEffect(() => {
    if (actionData?.intent === "delete" && actionData?.document) {
      toast({
        title: "Delete document",
        description: `Document ${actionData.document.name} deleted`,
      });
    }
  }, [actionData]);

  return (
    <div className="flex flex-col p-4 gap-8 w-full h-full overflow-y-auto">
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">Data</h1>
          <h1 className="text-sm text-muted-foreground">
            This is the data that your chatbot will be able to reference in its
            responses
          </h1>
        </div>
        <DialogDemo submit={submit} />
      </div>

      <div className="w-full max-w-md self-start">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search documents..."
          className="w-full"
        />
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-2">
            {data.error ? (
              <span className="text-red-500">{data.error}</span>
            ) : (
              `Showing ${totalItems} results for: "${searchTerm}"`
            )}
          </p>
        )}
      </div>

      <div
        key={`list-${data.totalItems}`}
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
            const searchMatches =
              data.searchResults?.[index]?.matchData.metadata;

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
                  <DocumentCard
                    item={item}
                    progress={
                      progress?.documentId === item.id ? progress : undefined
                    }
                    searchMatches={
                      searchMatches ? Object.keys(searchMatches) : undefined
                    }
                  />
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
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};
