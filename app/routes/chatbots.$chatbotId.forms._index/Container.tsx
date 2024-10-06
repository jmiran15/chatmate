import { cn } from "~/lib/utils";

export default function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 py-8 h-full flex flex-col gap-4 sm:gap-8 overflow-y-auto no-scrollbar",
        className,
      )}
    >
      {children}
    </div>
  );
}
