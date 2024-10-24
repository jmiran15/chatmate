import { cn } from "~/lib/utils";

interface FieldDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function FieldDescription({
  children,
  className,
}: FieldDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
}
