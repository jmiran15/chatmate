import { CheckCircle, Loader2, XCircle } from "lucide-react";
import * as React from "react";
import { useSpinDelay } from "spin-delay";
import { Button, type ButtonProps } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils.js";

export const StatusButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    status: "pending" | "success" | "error" | "idle";
    message?: string | null;
    spinDelay?: Parameters<typeof useSpinDelay>[1];
  }
>(({ message, status, className, children, spinDelay, ...props }, ref) => {
  const delayedPending = useSpinDelay(status === "pending", {
    delay: 400,
    minDuration: 300,
    ...spinDelay,
  });
  const companion = {
    pending: delayedPending ? (
      <div
        role="status"
        className="inline-flex h-6 w-6 items-center justify-center"
      >
        <Loader2 className="animate-spin" />
      </div>
    ) : null,
    success: (
      <div
        role="status"
        className="inline-flex h-6 w-6 items-center justify-center"
      >
        <CheckCircle className="h-6 w-6" />
      </div>
    ),
    error: (
      <div
        role="status"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive"
      >
        <XCircle className="h-6 w-6" />
      </div>
    ),
    idle: null,
  }[status];

  return (
    <Button
      ref={ref}
      className={cn("flex justify-center gap-4", className)}
      {...props}
    >
      <div>{children}</div>
      {message ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{companion}</TooltipTrigger>
            <TooltipContent>{message}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        companion
      )}
    </Button>
  );
});
StatusButton.displayName = "Button";
