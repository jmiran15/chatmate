import { useEffect, useState } from "react";
import { getFromLocalStorage, setToLocalStorage } from "./use-local-storage";

export function useFilterSort(searchParams: URLSearchParams) {
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
