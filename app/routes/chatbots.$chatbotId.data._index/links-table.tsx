import { z } from "zod";
import { urlSchema } from "./table/types";
import { columns } from "./table/columns";
import { DataTable } from "./table/table";
import { RowSelectionState } from "@tanstack/react-table";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";

export default function LinksTable({
  links,
  rowSelection,
  setRowSelection,
}: {
  links: string[];
  rowSelection: RowSelectionState;
  setRowSelection: (selection: RowSelectionState) => void;
}) {
  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        cell: (props: any) => {
          const link = props.row.original.url;
          return link ? (
            <a href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          ) : (
            <Skeleton />
          );
        },
      })),
    [columns],
  );

  return (
    <DataTable
      data={z.array(urlSchema).parse(
        links.map((url) => ({
          url,
        })),
      )}
      columns={tableColumns}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
