import { Link } from "@remix-run/react";
import { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function LinkCard({
  to,
  children,
  ariaLabel,
  className,
}: {
  to: string;
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        "block rounded-lg border bg-card text-card-foreground hover:shadow-sm hover:drop-shadow-sm hover:shadow-gray-200 transition-all duration-300 overflow-hidden w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function NonLinkCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "block rounded-lg border bg-card text-card-foreground hover:shadow-sm hover:drop-shadow-sm hover:shadow-gray-200 transition-all duration-300 w-full p-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
