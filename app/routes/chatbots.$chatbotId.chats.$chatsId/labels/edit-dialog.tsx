import type { Label as LabelType } from "@prisma/client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function EditDialog({
  setOpenCombobox,
  setOpenDialog,
  openDialog,
  labels,
  deleteLabel,
  updateLabel,
}: {
  setOpenCombobox: (open: boolean) => void;
  setOpenDialog: (open: boolean) => void;
  openDialog: boolean;
  labels: LabelType[];
  deleteLabel: (label: LabelType) => void;
  updateLabel: (
    label: LabelType,
    newLabel: Pick<LabelType, "name" | "color">,
  ) => void;
}) {
  return (
    <Dialog
      open={openDialog}
      onOpenChange={(open) => {
        if (!open) {
          setOpenCombobox(true);
        }
        setOpenDialog(open);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col">
        <DialogHeader>
          <DialogTitle>Edit Labels</DialogTitle>
          <DialogDescription>
            Change the label names or delete the labels. Create a label through
            the combobox though.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 flex-1 overflow-scroll px-6 py-2">
          {labels.map((label: LabelType) => {
            return (
              <DialogListItem
                key={label.name}
                item={label}
                onDelete={() => deleteLabel(label)}
                onSubmit={(newLabel: Pick<LabelType, "name" | "color">) =>
                  updateLabel(label, newLabel)
                }
                {...label}
              />
            );
          })}
        </div>
        <DialogFooter className="bg-opacity-40">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const badgeStyle = (color: string) => ({
  borderColor: `${color}20`,
  backgroundColor: `${color}30`,
  color,
});

export function DialogListItem({
  item,
  onSubmit,
  onDelete,
}: {
  item: LabelType;
  onSubmit: (newLabel: Pick<LabelType, "name" | "color">) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [accordionValue, setAccordionValue] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>(item.name);
  const [colorValue, setColorValue] = useState<string>(item.color);
  const disabled = item.name === inputValue && item.color === colorValue;

  useEffect(() => {
    if (accordionValue !== "") {
      inputRef.current?.focus();
    }
  }, [accordionValue]);

  return (
    <Accordion
      key={item.name}
      type="single"
      collapsible
      value={accordionValue}
      onValueChange={setAccordionValue}
    >
      <AccordionItem value={item.name}>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" style={badgeStyle(item.color)}>
              {item.name}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <AccordionTrigger>Edit</AccordionTrigger>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to delete the label{" "}
                    <Badge variant="outline" style={badgeStyle(item.color)}>
                      {item.name}
                    </Badge>{" "}
                    .
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <AccordionContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full gap-3">
              <Label htmlFor="name">Label name</Label>
              <Input
                ref={inputRef}
                id="name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={colorValue}
                onChange={(e) => setColorValue(e.target.value)}
                className="h-8 px-2 py-1"
              />
            </div>

            <Button
              onClick={() => {
                onSubmit({
                  name: inputValue,
                  color: colorValue,
                });
                setAccordionValue("");
              }}
              disabled={disabled}
              size="sm"
            >
              Save
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
