import { Document, DocumentType } from "@prisma/client";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useParams,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { LRUCache } from "lru-cache";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEventSource } from "remix-utils/sse/react";
import invariant from "tiny-invariant";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { prisma } from "~/db.server";
import { deleteDocumentById } from "~/models/document.server";
import { crawlQueue } from "~/queues/crawl.server";
import { queue } from "~/queues/ingestion.server";
import { parseFileQueue } from "~/queues/parsefile.server";
import { scrapeQueue } from "~/queues/scrape.server";
import { requireUserId } from "~/session.server";
import { validateUrl } from "~/utils";
import { ProgressData } from "../api.chatbot.$chatbotId.data.progress";
import {
  getDocuments,
  invalidateIndex,
  searchDocuments,
} from "./documents.server";
import DocumentsList, { getStartLimit, LIMIT } from "./documentsList";
import FilterSortBar from "./FilterSortBar";
import { webFlow } from "./flows.server";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "./hooks/use-local-storage";
import { usePendingDocuments } from "./hooks/use-pending-documents";
import { DialogDemo } from "./modal";

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
  const types = url.searchParams.getAll("type");
  const progress = url.searchParams.get("progress");
  const sort = url.searchParams.get("sort") || "createdAt:desc";

  const [sortField, sortDirection] = sort.split(":");

  const cacheKey = `${chatbotId}:${query}:${start}:${limit}:${types.join(
    ",",
  )}:${progress}:${sort}`;
  const cachedResult = searchCache.get(cacheKey);

  if (cachedResult) {
    console.log(`Cache hit for ${cacheKey}`);
    return json(cachedResult);
  }

  console.log(`Cache miss for ${cacheKey}`);

  const filters = {
    type: types.length > 0 ? (types as DocumentType[]) : undefined,
    isPending: progress ? progress === "pending" : undefined,
  };

  const sortOption = {
    field: sortField as "createdAt" | "updatedAt",
    direction: sortDirection as "asc" | "desc",
  };

  try {
    let result;

    if (query) {
      result = await searchDocuments(
        chatbotId,
        query,
        start,
        limit,
        filters,
        sortOption,
      );
    } else {
      result = await getDocuments(chatbotId, start, limit, filters, sortOption);
    }

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { chatbotId } = useParams();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const {
    searchTerm,
    selectedTypes,
    selectedProgress,
    selectedSort,
    setSearchTerm,
    setSelectedTypes,
    setSelectedProgress,
    setSelectedSort,
  } = useFilterSort(searchParams);

  // what if we get progress here - keep documents in state and update them when progres changes
  // then we can just send items to the infinite scroll list instead of each card having to calculate its content and status
  // when we get usePendingDocuments (i.e. inflight documents that havent caused revalidation) we just add them to the "items" state
  // and whenever we get progress we can update the state again

  // and we can probably do the local storage stuff in the useBefore... where we save the scroll position - also note ... we need to change the name of the scroll position localstorage key
  // can probably do the local storage stuff in client loader/action so that the "items" that we get from server is already the most up to date stuff - we just have to take care of new info!!!

  // PROBABLY CLEANEST WAY TO DO THIS ^^^^^

  const eventSource = useEventSource(`/api/chatbot/${chatbotId}/data/progress`);
  const progress: ProgressData | undefined = useMemo(() => {
    return eventSource ? JSON.parse(eventSource) : undefined;
  }, [eventSource]);

  // optimistic documents

  // on slow networks, the last document gets cut off the virtual list
  const pendingDocuments = usePendingDocuments();
  const updatedData = useMemo(() => {
    const newData = { ...data };
    newData.items = [...pendingDocuments, ...data.items];
    newData.totalItems = data.totalItems + pendingDocuments.length;
    return newData;
  }, [data, pendingDocuments]);

  // data = updatedData;

  useEffect(() => {
    if (actionData?.intent === "delete" && actionData?.document) {
      toast({
        title: "Delete document",
        description: `Document ${actionData.document.name} deleted`,
      });
    }
  }, [actionData]);

  const handleProgressUpdate = useCallback(
    (progressData: ProgressData) => {
      const updatedData = { ...data };
      const documentIndex = updatedData.items.findIndex(
        (item: Document) => item.id === progressData.documentId,
      );
      if (documentIndex !== -1) {
        updatedData.items[documentIndex] = {
          ...updatedData.items[documentIndex],
          isPending: !progressData.completed,
          content:
            progressData.returnvalue?.content ??
            updatedData.items[documentIndex].content,
        };
      }
    },
    [data],
  );

  useEffect(() => {
    if (progress) {
      handleProgressUpdate(progress);
    }
  }, [progress, handleProgressUpdate]);

  const debouncedSearch = useDebouncedCallback((term: string) => {
    setSearchParams(
      {
        start: "0",
        limit: LIMIT.toString(),
        q: term,
        type: selectedTypes,
        progress: selectedProgress,
        sort: selectedSort,
      },
      { replace: true },
    );
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleTypeChange = (selected: string[]) => {
    setSelectedTypes(selected);
  };

  const handleProgressChange = (selected: string[]) => {
    setSelectedProgress(selected[0] || "");
  };

  const handleSortChange = (selected: string) => {
    setSelectedSort(selected);
  };

  const typeOptions = [
    {
      value: "WEBSITE",
      label: "Website",
      count: data.filterCounts.find((c) => c.type === "WEBSITE")?._count || 0,
    },
    {
      value: "FILE",
      label: "File",
      count: data.filterCounts.find((c) => c.type === "FILE")?._count || 0,
    },
    {
      value: "RAW",
      label: "Raw",
      count: data.filterCounts.find((c) => c.type === "RAW")?._count || 0,
    },
  ];

  const progressOptions = [
    {
      value: "pending",
      label: "Pending",
      count: data.filterCounts.find((c) => c.isPending === true)?._count || 0,
    },
    {
      value: "completed",
      label: "Completed",
      count: data.filterCounts.find((c) => c.isPending === false)?._count || 0,
    },
  ];

  const sortOptions = [
    { value: "createdAt:desc", label: "Created: new to old" },
    { value: "createdAt:asc", label: "Created: old to new" },
    { value: "updatedAt:desc", label: "Updated: new to old" },
    { value: "updatedAt:asc", label: "Updated: old to new" },
  ];

  const getTypeLabel = (value: string): string => {
    const option = typeOptions.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const getFilterFeedback = () => {
    const parts = [];
    if (searchTerm) {
      parts.push(`matching "${searchTerm}"`);
    }
    if (selectedTypes.length > 0) {
      const typeLabels = selectedTypes.map(getTypeLabel);
      parts.push(`of type ${typeLabels.join(" or ")}`);
    }
    if (selectedProgress) {
      parts.push(`with ${selectedProgress} status`);
    }

    let feedback = `Showing ${updatedData.totalItems} document${
      updatedData.totalItems !== 1 ? "s" : ""
    }`;
    if (parts.length > 0) {
      feedback += ` ${parts.join(", ")}`;
    }

    const sortOption = sortOptions.find(
      (option) => option.value === selectedSort,
    );
    if (sortOption) {
      feedback += `, sorted by ${sortOption.label.toLowerCase()}`;
    }

    // Apply lowercase transformation and capitalize the first letter
    feedback = feedback.toLowerCase();
    feedback = feedback.charAt(0).toUpperCase() + feedback.slice(1);

    return feedback;
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    setSelectedProgress("");
    setSelectedSort("createdAt:desc");
  };

  useEffect(() => {
    const newParams: Record<string, string> = {};
    if (searchTerm) newParams.q = searchTerm;
    if (selectedTypes.length > 0) newParams.type = selectedTypes.join(",");
    if (selectedProgress) newParams.progress = selectedProgress;
    if (selectedSort) newParams.sort = selectedSort;

    setSearchParams(newParams, { replace: true });
  }, [
    searchTerm,
    selectedTypes,
    selectedProgress,
    selectedSort,
    setSearchParams,
  ]);

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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
          <Input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search documents..."
            className="w-full sm:max-w-md sm:min-w-sm"
          />
          <FilterSortBar
            typeOptions={typeOptions}
            progressOptions={progressOptions}
            sortOptions={sortOptions}
            selectedTypes={selectedTypes}
            selectedProgress={selectedProgress}
            selectedSort={selectedSort}
            onTypeChange={handleTypeChange}
            onProgressChange={handleProgressChange}
            onSortChange={handleSortChange}
            onClearAll={handleClearAll}
          />
        </div>
        {(searchTerm ||
          selectedTypes.length > 0 ||
          selectedProgress ||
          selectedSort !== "createdAt:desc") && (
          <p className="text-sm text-muted-foreground">
            {data.error ? (
              <span className="text-red-500">{data.error}</span>
            ) : (
              getFilterFeedback()
            )}
          </p>
        )}
      </div>

      <DocumentsList
        items={updatedData.items}
        totalItems={updatedData.totalItems}
        searchTerm={searchTerm}
        searchResults={data.searchResults}
        progress={progress}
      />
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/data`,
  breadcrumb: "data",
};

function useFilterSort(searchParams: URLSearchParams) {
  const [filters, setFilters] = useState(() => {
    const storedFilters = getFromLocalStorage("documentFilters", {
      searchTerm: "",
      selectedTypes: [],
      selectedProgress: "",
      selectedSort: "createdAt:desc",
    });

    return {
      searchTerm: searchParams.get("q") || storedFilters.searchTerm,
      selectedTypes:
        searchParams.getAll("type").length > 0
          ? searchParams.getAll("type")
          : storedFilters.selectedTypes,
      selectedProgress:
        searchParams.get("progress") || storedFilters.selectedProgress,
      selectedSort: searchParams.get("sort") || storedFilters.selectedSort,
    };
  });

  useEffect(() => {
    setToLocalStorage("documentFilters", filters);
  }, [filters]);

  const setSearchTerm = (term: string) =>
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  const setSelectedTypes = (types: string[]) =>
    setFilters((prev) => ({ ...prev, selectedTypes: types }));
  const setSelectedProgress = (progress: string) =>
    setFilters((prev) => ({ ...prev, selectedProgress: progress }));
  const setSelectedSort = (sort: string) =>
    setFilters((prev) => ({ ...prev, selectedSort: sort }));

  return {
    ...filters,
    setSearchTerm,
    setSelectedTypes,
    setSelectedProgress,
    setSelectedSort,
  };
}
