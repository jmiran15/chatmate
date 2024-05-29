import { cn } from "~/lib/utils";

export default function H3({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mx-auto text-xl max-w-2xl text-balance", className)}>
      {children}
    </p>
  );
}
