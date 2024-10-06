import { Document } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/components/ui/use-toast";
import Container from "../chatbots.$chatbotId.forms._index/Container";
import Description from "../chatbots.$chatbotId.forms._index/Description";
import Title from "../chatbots.$chatbotId.forms._index/Title";
import { action } from "./action.server";
import DocumentsList, { LIMIT } from "./documentsList";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "./hooks/use-local-storage";
import { useOptimisticDocuments } from "./hooks/useOptimisticDocuments";
import { loader } from "./loader.server";
import { NewSortBar } from "./ui/FilterSortBar";
import { DialogDemo } from "./ui/modal";

export { action, loader };

export type OptimisticDocument = SerializeFrom<Document> & {
  // for loading purposes
  status: string; // for showing the percentage `Ingesting 10%`
};

export default function Data() {
  const { items, error } = useLoaderData<typeof loader>();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
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

  console.log("Loader data: ", items);

  const { documents } = useOptimisticDocuments({
    items,
  });

  useEffect(() => {
    if (actionData?.intent === "delete" && actionData?.document) {
      toast({
        title: "Delete document",
        description: `Document ${actionData.document.name} deleted`,
      });
    }
  }, [actionData]);

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
    setSelectedProgress(selected);
  };

  const handleSortChange = (selected: string) => {
    setSelectedSort(selected);
  };

  const typeOptions = [
    {
      value: "WEBSITE",
      label: "Website",
    },
    {
      value: "FILE",
      label: "File",
    },
    {
      value: "RAW",
      label: "Raw",
    },
  ];

  const progressOptions = [
    {
      value: "pending",
      label: "Pending",
    },
    {
      value: "completed",
      label: "Completed",
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
    if (selectedProgress.length > 0) {
      parts.push(`with ${selectedProgress.join(" or ")} status`);
    }

    let feedback = `Showing ${documents.length} document${
      documents.length !== 1 ? "s" : ""
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
    setSelectedProgress([]);
    setSelectedSort("createdAt:desc");
  };

  useEffect(() => {
    const newParams: Record<string, string | string[]> = {};
    if (searchTerm) newParams.q = searchTerm;
    if (selectedTypes.length > 0) newParams.type = selectedTypes;
    if (selectedProgress.length > 0) newParams.progress = selectedProgress;
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
    <Container className="max-w-5xl">
      <Header submit={submit} />
      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
          <Input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search documents..."
            className="flex-1"
          />
          <NewSortBar
            sortOptions={sortOptions}
            selectedSort={selectedSort}
            onSortChange={handleSortChange}
          />
          {/* <FilterSortBar
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
          /> */}
        </div>
        {(searchTerm ||
          selectedTypes.length > 0 ||
          selectedProgress.length > 0 ||
          selectedSort !== "createdAt:desc") && (
          <p className="text-sm text-muted-foreground">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              getFilterFeedback()
            )}
          </p>
        )}
      </div>

      <DocumentsList
        items={documents}
        totalItems={documents.length}
        searchTerm={searchTerm}
      />
    </Container>
  );
}

function Header({ submit }: { submit: ReturnType<typeof useSubmit> }) {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between">
      <div className="flex flex-col">
        <Title>Data</Title>
        <Description>
          This is the data that your chatbot will be able to reference in its
          responses
        </Description>
      </div>
      <DialogDemo submit={submit} />
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
      selectedProgress: [],
      selectedSort: "createdAt:desc",
    });

    return {
      searchTerm: searchParams.get("q") || storedFilters.searchTerm,
      selectedTypes:
        searchParams.getAll("type").length > 0
          ? searchParams.getAll("type")
          : storedFilters.selectedTypes,
      selectedProgress:
        searchParams.getAll("progress").length > 0
          ? searchParams.getAll("progress")
          : storedFilters.selectedProgress,
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
  const setSelectedProgress = (progress: string[]) =>
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
