import { cn } from "~/lib/utils";

export default function H2({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mx-auto text-5xl max-w-2xl text-balance tracking-tight font-display",
        className,
      )}
    >
      {children}
    </p>
  );
}
