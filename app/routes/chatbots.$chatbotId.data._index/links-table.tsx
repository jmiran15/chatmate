import { z } from "zod";
import { urlSchema } from "./table/types";
import { columns } from "./table/columns";
import { DataTable } from "./table/table";
import { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";

const MAX_CRAWLED_LINKS = 10;

export default function LinksTable({
  links,
  rowSelection,
  setRowSelection,
}: {
  links: string[];
  rowSelection: RowSelectionState;
  setRowSelection: (selection: RowSelectionState) => void;
}) {
  console.log("links-table.tsx - links: ", links);

  const tableData = useMemo(
    () =>
      z.array(urlSchema).parse(
        (links.length === 0 ? Array(MAX_CRAWLED_LINKS).fill("") : links).map(
          (url) => ({
            url,
          }),
        ),
      ),
    [links],
  );

  const tableColumns = useMemo(
    () =>
      links.length === 0
        ? columns.map((column) => ({
            ...column,
            cell: <Skeleton />,
          }))
        : columns,
    [columns, links],
  );

  return (
    <DataTable
      data={tableData}
      columns={tableColumns}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
