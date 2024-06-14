import { z } from "zod";
import { urlSchema } from "./table/types";
import { columns } from "./table/columns";
import { DataTable } from "./table/table";
import { RowSelectionState } from "@tanstack/react-table";

export default function LinksTable({
  links,
  rowSelection,
  setRowSelection,
}: {
  links: string[];
  rowSelection: RowSelectionState;
  setRowSelection: (selection: RowSelectionState) => void;
}) {
  return (
    <DataTable
      data={z.array(urlSchema).parse(
        links.map((url) => ({
          url,
        })),
      )}
      columns={columns}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
