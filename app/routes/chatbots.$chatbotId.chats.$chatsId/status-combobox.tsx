import * as React from "react";
import { ArrowUpCircle, Circle, LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { TicketStatus } from "@prisma/client";
import { useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { loader } from "./route";

interface Status {
  value: string;
  label: string;
  icon: LucideIcon;
}

const statuses: Status[] = [
  {
    value: TicketStatus.CLOSED,
    label: "Closed",
    icon: Circle,
  },
  {
    value: TicketStatus.OPEN,
    label: "Open",
    icon: ArrowUpCircle,
  },
];

export default function StatusComboboxPopover() {
  const [open, setOpen] = React.useState(false);
  const { chatsId } = useParams();
  const { chat } = useLoaderData<typeof loader>();
  const fetcher = useFetcher({ key: `update-status-${chatsId}` });

  const selectedStatus: Status | null =
    statuses.find(
      (priority) =>
        priority.value ===
        (fetcher.formData ? fetcher.formData?.get("status") : chat?.status),
    ) || null;

  return (
    <div className="flex items-center justify-start gap-2 w-full">
      <p className="text-sm text-muted-foreground">Status</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="w-[150px] justify-start">
            {selectedStatus ? (
              <>
                <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
                {selectedStatus.label}
              </>
            ) : (
              <>+ Set status</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="right" align="start">
          <Command>
            <CommandInput placeholder="Change status..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {statuses.map((status) => (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={(value) => {
                      fetcher.submit(
                        {
                          intent: "update-status",
                          status:
                            statuses.find(
                              (priority) => priority.value === value,
                            )?.value || TicketStatus.CLOSED,
                        },
                        {
                          method: "POST",
                          preventScrollReset: true,
                          unstable_flushSync: true,
                        },
                      );

                      setOpen(false);
                    }}
                  >
                    <status.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        status.value === selectedStatus?.value
                          ? "opacity-100"
                          : "opacity-40",
                      )}
                    />
                    <span>{status.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
