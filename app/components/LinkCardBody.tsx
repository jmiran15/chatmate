import { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function LinkCardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="text-sm text-muted-foreground line-clamp-2">
        {children}
      </div>
    </div>
  );
}
