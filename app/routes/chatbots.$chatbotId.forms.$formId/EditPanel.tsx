import type { FormElement } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { loader } from "./route";

export default function EditPanel({
  editingElement,
  setEditingElement,
}: {
  editingElement: SerializeFrom<FormElement> | null;
  setEditingElement: (element: SerializeFrom<FormElement> | null) => void;
}) {
  const { clientTypes } = useLoaderData<typeof loader>();
  const [isElementDeleteDialogOpen, setIsElementDeleteDialogOpen] =
    useState(false);
  const updateFetcher = useFetcher({ key: "update" });
  const deleteFetcher = useFetcher({ key: "delete" });

  const updateFormElement = (element: SerializeFrom<FormElement>) => {
    updateFetcher.submit(
      { partialElement: JSON.stringify(element), intent: "update" },
      {
        method: "POST",
      },
    );
    setEditingElement(element);
  };

  const deleteFormElement = () => {
    if (!editingElement) return;

    deleteFetcher.submit(
      { elementId: editingElement.id, intent: "delete" },
      {
        method: "POST",
      },
    );

    setEditingElement(null);
    setIsElementDeleteDialogOpen(false);
  };

  const renderSpecificSettings = () => {
    if (!editingElement) return null;

    switch (editingElement.type) {
      case clientTypes.NUMBER:
      case clientTypes.RATING:
      case clientTypes.SCALE:
      case clientTypes.SLIDER:
        return (
          <>
            <div>
              <Label htmlFor="min">Min</Label>
              <Input
                id="min"
                type="number"
                value={editingElement.min || ""}
                onChange={(e) =>
                  updateFormElement({
                    ...editingElement,
                    min: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="max">Max</Label>
              <Input
                id="max"
                type="number"
                value={editingElement.max || ""}
                onChange={(e) =>
                  updateFormElement({
                    ...editingElement,
                    max: Number(e.target.value),
                  })
                }
              />
            </div>
            {editingElement.type === clientTypes.SLIDER && (
              <div>
                <Label htmlFor="step">Step</Label>
                <Input
                  id="step"
                  type="number"
                  value={editingElement.step || ""}
                  onChange={(e) =>
                    updateFormElement({
                      ...editingElement,
                      step: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </>
        );
      case clientTypes.SELECT:
        return (
          <div>
            <Label htmlFor="options">Options (one per line)</Label>
            <Textarea
              id="options"
              value={editingElement.options?.join("\n") || ""} // Provide a default empty string
              onChange={(e) =>
                updateFormElement({
                  ...editingElement,
                  options: e.target.value.split("\n"),
                })
              }
              className="min-h-[100px]"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderEditPanel = () => {
    if (!editingElement) return null;

    return (
      <div className="space-y-4 overflow-y-auto">
        <h3 className="text-lg font-semibold">
          Edit {editingElement.type} Input
        </h3>
        <div>
          <Label htmlFor="name">Field Name</Label>
          <Input
            id="name"
            value={editingElement.name}
            onChange={(e) =>
              updateFormElement({ ...editingElement, name: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={editingElement.label}
            onChange={(e) =>
              updateFormElement({ ...editingElement, label: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={editingElement.placeholder || ""}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                placeholder: e.target.value,
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editingElement.description || ""}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                description: e.target.value,
              })
            }
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={editingElement.required}
            onChange={(e) =>
              updateFormElement({
                ...editingElement,
                required: e.target.checked,
              })
            }
          />
          <Label htmlFor="required">Required</Label>
        </div>
        {renderSpecificSettings()}

        <DeleteElement
          isElementDeleteDialogOpen={isElementDeleteDialogOpen}
          setIsElementDeleteDialogOpen={setIsElementDeleteDialogOpen}
          deleteFormElement={deleteFormElement}
        />
      </div>
    );
  };

  return renderEditPanel();
}

function DeleteElement({
  isElementDeleteDialogOpen,
  setIsElementDeleteDialogOpen,
  deleteFormElement,
}: {
  isElementDeleteDialogOpen: boolean;
  setIsElementDeleteDialogOpen: (isElementDeleteDialogOpen: boolean) => void;
  deleteFormElement: () => void;
}) {
  return (
    <AlertDialog
      open={isElementDeleteDialogOpen}
      onOpenChange={setIsElementDeleteDialogOpen}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full mt-4">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Element
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the form
            element.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteFormElement}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
