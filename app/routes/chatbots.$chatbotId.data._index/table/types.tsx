import { z } from "zod";
import { Column, ColumnDef, Row, Table } from "@tanstack/react-table";

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export const urlSchema = z.object({
  url: z.string(),
  title: z.string(),
});

export type Url = z.infer<typeof urlSchema>;

export interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}
