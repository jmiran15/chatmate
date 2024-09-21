import { FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import AddType from "./AddType";
import EditPanel from "./EditPanel";

export default function RightBar({
  isAddingBlock,
  editingElement,
  setIsAddingBlock,
  setEditingElement,
}: {
  isAddingBlock: boolean;
  editingElement: SerializeFrom<FormElement> | null;
  setIsAddingBlock: (isAddingBlock: boolean) => void;
  setEditingElement: (element: SerializeFrom<FormElement> | null) => void;
}) {
  return (
    <div
      className={cn(
        "h-full bg-white shadow-lg transition-all duration-300 ease-in-out",
        isAddingBlock || editingElement ? "w-64" : "w-0",
      )}
    >
      <div className="w-64 h-full">
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {isAddingBlock ? "Add Block" : "Edit Block"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAddingBlock(false);
                setEditingElement(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isAddingBlock ? (
            <AddType
              setIsAddingBlock={setIsAddingBlock}
              setEditingElement={setEditingElement}
            />
          ) : (
            <EditPanel
              editingElement={editingElement}
              setEditingElement={setEditingElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}
