import { Check, Edit2, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import type { Label as LabelType } from "@prisma/client";
import { useRef, useState } from "react";
import { useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { loader } from "~/routes/chatbots.$chatbotId.chats.$chatsId/route";
import EditDialog from "./edit-dialog";
import CommandItemCreate from "./command-item-create";

const badgeStyle = (color: string) => ({
  borderColor: `${color}20`,
  backgroundColor: `${color}30`,
  color,
});

// pass in labels as props?
// deal with optimistic label add and remove outside of here, just change the prop
export function FancyBox() {
  const { chatsId } = useParams();
  const { chat, chatbot } = useLoaderData<typeof loader>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher({ key: `update-labels-${chatsId}` });
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  // two main optimistic variables here:
  // 1. All labels belonging to this chatbot
  // 2. The labels that are selected
  const labels: LabelType[] = chatbot.labels;
  const selectedLabels: LabelType[] = chat.labels;

  console.log("combobox: ", {
    chat,
    chatbot,
  });

  const createLabel = ({ name }: Pick<LabelType, "name">) => {
    fetcher.submit(
      {
        intent: "create-label",
        "label-name": name,
      },
      {
        method: "POST",
        preventScrollReset: true,
        navigate: false,
        unstable_flushSync: true,
      },
    );
  };

  const updateLabel = (
    label: LabelType,
    newLabel: Pick<LabelType, "name" | "color">,
  ) => {
    fetcher.submit(
      {
        intent: "update-label",
        "label-id": label.id,
        "label-name": newLabel.name,
        "label-color": newLabel.color,
      },
      {
        method: "POST",
        preventScrollReset: true,
        navigate: false,
        unstable_flushSync: true,
      },
    );
  };

  const deleteLabel = (label: LabelType) => {
    fetcher.submit(
      {
        intent: "delete-label",
        "label-id": label.id,
      },
      {
        method: "POST",
        preventScrollReset: true,
        navigate: false,
        unstable_flushSync: true,
      },
    );
  };

  const toggleLabel = (label: LabelType) => {
    selectedLabels?.map((label) => label.name).includes(label.name)
      ? disconnectLabel(label)
      : connectLabel(label);
    inputRef?.current?.focus();
  };

  const connectLabel = (label: LabelType) => {
    fetcher.submit(
      {
        intent: "connect-label",
        "label-id": label.id,
      },
      {
        method: "POST",
        preventScrollReset: true,
        navigate: false,
        unstable_flushSync: true,
      },
    );
  };

  const disconnectLabel = (label: LabelType) => {
    fetcher.submit(
      {
        intent: "disconnect-label",
        "label-id": label.id,
      },
      {
        method: "POST",
        preventScrollReset: true,
        navigate: false,
        unstable_flushSync: true,
      },
    );
  };

  const onComboboxOpenChange = (value: boolean) => {
    inputRef.current?.blur(); // HACK: otherwise, would scroll automatically to the bottom of page
    setOpenCombobox(value);
  };

  const hasSelectedLabels = selectedLabels.length > 0;

  return (
    <div className="flex items-center justify-start gap-2 flex-wrap">
      {selectedLabels.map((label: LabelType) => (
        <Badge
          key={label.id ?? label.name}
          variant="outline"
          style={badgeStyle(label.color)}
        >
          {label.name}
        </Badge>
      ))}
      <Popover open={openCombobox} onOpenChange={onComboboxOpenChange}>
        <PopoverTrigger asChild>
          <Button
            size={"xs"}
            variant="ghost"
            role="combobox"
            aria-expanded={openCombobox}
            className={cn(
              "justify-between text-foreground flex items-center gap-2",
              hasSelectedLabels && "rounded-full",
            )}
          >
            <Plus className="h-4 w-4 shrink-0 opacity-50" />
            {!hasSelectedLabels && <span className="truncate">Add labels</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command loop>
            <CommandInput
              ref={inputRef}
              placeholder="Search framework..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandGroup className="max-h-[145px] overflow-auto">
                {labels.map((label: LabelType) => {
                  const isActive = selectedLabels
                    ?.map((label) => label.name)
                    .includes(label.name);

                  return (
                    <CommandItem
                      key={label.id ?? label.name}
                      value={label.name}
                      onSelect={() => toggleLabel(label)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1">{label.name}</div>
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    </CommandItem>
                  );
                })}
                <CommandItemCreate
                  onSelect={() => createLabel({ name: inputValue })}
                  {...{ inputValue, labels }}
                />
              </CommandGroup>
              <CommandSeparator alwaysRender />
              <CommandGroup>
                <CommandItem
                  value={`:${inputValue}:`} // HACK: that way, the edit button will always be shown
                  className="text-xs text-muted-foreground"
                  onSelect={() => setOpenDialog(true)}
                >
                  <div className={cn("mr-2 h-4 w-4")} />
                  <Edit2 className="mr-2 h-2.5 w-2.5" />
                  Edit Labels
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <EditDialog
        setOpenCombobox={setOpenCombobox}
        setOpenDialog={setOpenDialog}
        openDialog={openDialog}
        labels={labels}
        deleteLabel={deleteLabel}
        updateLabel={updateLabel}
      />
    </div>
  );
}
