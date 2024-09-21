import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const onDragStart = ({ active }: { active: any }) => {
    setActiveId(active.id);
  };

  const onDragOver = ({ active, over }: { active: any; over: any }) => {
    if (over && active.id !== over.id) {
      const oldIndex = optimisticFormElements.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = optimisticFormElements.findIndex(
        (item) => item.id === over.id,
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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = optimisticFormElements.findIndex(
        (item) => item.id === active.id,
      );
      const newIndex = optimisticFormElements.findIndex(
        (item) => item.id === over?.id,
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
    setActiveId(null); // Reset activeId
  };

  const handleElementClick = (element: SerializeFrom<FormElement>) => {
    setEditingElement(element);
    setIsAddingBlock(false);
  };
  const activeElement = optimisticFormElements.find(
    (item) => item.id === activeId,
  );
  return (
    <TooltipProvider>
      <div className="w-64 bg-white p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Structure</h2>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={optimisticFormElements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {optimisticFormElements.map((element) => (
                <SortableItem
                  key={element.id}
                  element={element}
                  onEdit={handleElementClick}
                  isActive={editingElement?.id === element.id}
                  editingElement={editingElement}
                  setEditingElement={setEditingElement}
                  isDragging={activeId === element.id}
                />
              ))}
            </ul>
          </SortableContext>

          {/* Add DragOverlay */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              <SortableItem
                element={activeElement!}
                onEdit={() => {}}
                isActive={false}
                editingElement={editingElement}
                setEditingElement={setEditingElement}
                isDragging={true}
                isOverlay={true}
              />
            ) : null}
          </DragOverlay>
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
    </TooltipProvider>
  );
}

function SortableItem({
  element,
  onEdit,
  isActive,
  editingElement,
  setEditingElement,
  isDragging = false,
  isOverlay = false,
}: {
  element: SerializeFrom<FormElement>;
  onEdit: (element: SerializeFrom<FormElement>) => void;
  isActive: boolean;
  editingElement: SerializeFrom<FormElement> | null;
  setEditingElement: (element: SerializeFrom<FormElement> | null) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const deleteFetcher = useFetcher({ key: "delete" });

  const handleDelete = () => {
    deleteFetcher.submit(
      { elementId: element.id, intent: "delete" },
      { method: "POST" },
    );
    setIsDeleteDialogOpen(false);
    if (editingElement?.id === element.id) {
      setEditingElement(null);
    }
  };

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          "flex items-center justify-between p-2 rounded cursor-pointer",
          isActive ? "bg-gray-200" : isHovering ? "bg-gray-100" : "bg-gray-50",
          isDragging && !isOverlay && "opacity-50",
          isOverlay && "shadow-lg bg-white",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onEdit(element)}
      >
        <div className="flex items-center space-x-2 w-full">
          <span
            {...listeners}
            className="flex-shrink-0 cursor-grab"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </span>
          <span className="flex-grow text-sm break-words break-all">
            {element.label}
          </span>
          <div className="flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering onEdit
                    setIsDeleteDialogOpen(true);
                  }}
                  className={cn(
                    "hover:bg-transparent focus:ring-0",
                    !isHovering && "opacity-0",
                  )}
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete element</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </li>

      {/* AlertDialog for delete confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              form element.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
