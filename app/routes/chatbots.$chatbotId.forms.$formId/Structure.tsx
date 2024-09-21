import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function FormStructure({
  optimisticFormElements,
  setIsAddingBlock,
  setEditingElement,
  editingElement,
}: {
  optimisticFormElements: SerializeFrom<FormElement[]>;
  setIsAddingBlock: (isAddingBlock: boolean) => void;
  setEditingElement: (element: SerializeFrom<FormElement> | null) => void;
  editingElement: SerializeFrom<FormElement> | null;
}) {
  const reorderFetcher = useFetcher({ key: "reorder" });
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = optimisticFormElements.findIndex(
        (item: SerializeFrom<FormElement>) => item.id === active.id,
      );
      const newIndex = optimisticFormElements.findIndex(
        (item: SerializeFrom<FormElement>) => item.id === over?.id,
      );

      reorderFetcher.submit(
        {
          oldIndex: oldIndex,
          newIndex: newIndex,
          elements: JSON.stringify(optimisticFormElements),
          intent: "reorder",
        },
        { method: "POST" },
      );
    }
  };

  const handleElementClick = (element: SerializeFrom<FormElement>) => {
    setEditingElement(element);
    setIsAddingBlock(false);
  };

  return (
    <div className="w-64 bg-white p-4 shadow-md">
      <h2 className="text-lg font-semibold mb-4">Structure</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={optimisticFormElements.map(
            (el: SerializeFrom<FormElement>) => el.id,
          )}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {optimisticFormElements.map(
              (element: SerializeFrom<FormElement>) => (
                <SortableItem
                  key={element.id}
                  element={element}
                  onEdit={handleElementClick}
                  isActive={editingElement?.id === element.id}
                />
              ),
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <Button
        onClick={() => {
          setIsAddingBlock(true);
          setEditingElement(null);
        }}
        className="w-full mt-4"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Block
      </Button>
    </div>
  );
}

// TODO - add some way to delete the element from here
function SortableItem({
  element,
  onEdit,
  isActive,
}: {
  element: SerializeFrom<FormElement>;
  onEdit: (element: SerializeFrom<FormElement>) => void;
  isActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) =>
        listeners?.onKeyDown?.(e as any)
      }
      onPointerDown={(e: React.PointerEvent<HTMLLIElement>) => {
        onEdit(element);
        listeners?.onPointerDown?.(e as any)();
      }}
      className={cn(
        "flex items-center justify-between p-2 rounded cursor-pointer",
        isActive ? "bg-gray-200" : "bg-gray-50 hover:bg-gray-100",
      )}
    >
      <div className="flex items-center space-x-2">
        <span>
          <GripVertical className="h-4 w-4 text-gray-400" />
        </span>
        <span>{element.label}</span>
      </div>
      <span className="text-gray-500">{element.type}</span>
    </li>
  );
}
