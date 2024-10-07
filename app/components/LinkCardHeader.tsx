import { ReactNode } from "react";

export function LinkCardHeader({
  title,
  tag,
}: {
  title: string;
  tag: ReactNode | undefined;
}) {
  return (
    <div className="flex justify-between items-start">
      <div className="font-semibold text-base sm:text-lg text-primary truncate w-full">
        {title}
      </div>
      {tag && (
        <div className="flex-shrink-0 ml-2 text-muted-foreground text-sm">
          {tag}
        </div>
      )}
    </div>
  );
}
