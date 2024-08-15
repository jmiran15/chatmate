import React from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MultiSelect, Option } from "./multiSelect";

interface FilterOption extends Option {
  count: number;
}

interface FilterSortBarProps {
  typeOptions: FilterOption[];
  progressOptions: FilterOption[];
  sortOptions: Option[];
  selectedTypes: string[];
  selectedProgress: string[];
  selectedSort: string;
  onTypeChange: (selected: string[]) => void;
  onProgressChange: (selected: string[]) => void;
  onSortChange: (selected: string) => void;
  onClearAll: () => void;
}

const FilterSortBar: React.FC<FilterSortBarProps> = ({
  typeOptions,
  progressOptions,
  sortOptions,
  selectedTypes,
  selectedProgress,
  selectedSort,
  onTypeChange,
  onProgressChange,
  onSortChange,
  onClearAll,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
      <MultiSelect
        options={typeOptions}
        selected={typeOptions.filter((option) =>
          selectedTypes.includes(option.value),
        )}
        onChange={(selected) => {
          onTypeChange(selected.map((option) => option.value));
        }}
        placeholder="Filter by type"
        className="min-w-[150px] max-w-[300px] flex-grow mt-2"
      />
      <MultiSelect
        options={progressOptions}
        selected={progressOptions.filter((option) =>
          selectedProgress.includes(option.value),
        )}
        onChange={(selected) =>
          onProgressChange(selected.map((option) => option.value))
        }
        placeholder="Filter by progress"
        className="min-w-[150px] max-w-[300px] flex-grow mt-2"
      />
      <Select onValueChange={onSortChange} value={selectedSort}>
        <SelectTrigger className="min-w-[120px] max-w-[200px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={onClearAll}
        variant="secondary"
        className="w-full sm:w-auto"
      >
        Clear all
      </Button>
    </div>
  );
};

export default FilterSortBar;
