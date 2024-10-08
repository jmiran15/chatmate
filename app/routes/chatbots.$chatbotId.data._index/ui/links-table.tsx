import { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { z } from "zod";
import { columns } from "../table/columns";
import { DataTable } from "../table/table";
import { urlSchema } from "../table/types";

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
      links={links}
      columns={tableColumns}
      data={tableData}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
