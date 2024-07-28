import type { Label as LabelType } from "@prisma/client";
import { CommandItem } from "~/components/ui/command";
import { cn } from "~/lib/utils";

export default function CommandItemCreate({
  inputValue,
  labels,
  onSelect,
}: {
  inputValue: string;
  labels: LabelType[];
  onSelect: () => void;
}) {
  const hasNoLabel = !labels
    .map(({ name }: { name: string }) => name)
    .includes(`${inputValue.toLowerCase()}`);

  const render = inputValue !== "" && hasNoLabel;

  if (!render) return null;

  // BUG: whenever a space is appended, the Create-Button will not be shown.
  return (
    <CommandItem
      key={`${inputValue}`}
      value={`${inputValue}`}
      className="text-xs text-muted-foreground"
      onSelect={onSelect}
    >
      <div className={cn("mr-2 h-4 w-4")} />
      Create new label &quot;{inputValue}&quot;
    </CommandItem>
  );
}
