import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type Bar<T> = T & {
  key?: string;
  href?: string;
  value: number;
  name: string | null;
  img?: React.ReactNode;
};

interface BarListProps<T = unknown>
  extends React.HTMLAttributes<HTMLDivElement> {
  data: Bar<T>[];
  valueFormatter?: (value: number) => string;
  showAnimation?: boolean;
  onValueChange?: (payload: Bar<T>) => void;
  sortOrder?: "ascending" | "descending" | "none";
}

function BarListInner<T>(
  {
    data = [],
    valueFormatter = (value) => value.toString(),
    showAnimation = false,
    onValueChange,
    sortOrder = "descending",
    className,
    ...props
  }: BarListProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Component = onValueChange ? "button" : "div";
  const sortedData = React.useMemo(() => {
    if (sortOrder === "none") {
      return data;
    }
    return [...data].sort((a, b) => {
      return sortOrder === "ascending" ? a.value - b.value : b.value - a.value;
    });
  }, [data, sortOrder]);

  const widths = React.useMemo(() => {
    const maxValue = Math.max(...sortedData.map((item) => item.value), 0);
    return sortedData.map((item) =>
      item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 2),
    );
  }, [sortedData]);

  const rowHeight = "h-[30px]";

  const visibleData = isExpanded ? sortedData : sortedData.slice(0, 10);
  const remainingItems = sortedData.length - 10;

  return (
    <div
      ref={forwardedRef}
      className={cn("flex flex-col space-y-4", className)}
      aria-sort={sortOrder}
      {...props}
    >
      <div className="flex justify-between space-x-6">
        <div className="relative w-full space-y-1.5">
          {visibleData.map((item, index) => (
            <Component
              key={item.key ?? item.name}
              onClick={() => {
                onValueChange?.(item);
              }}
              className={cn(
                "group w-full rounded",
                onValueChange
                  ? [
                      "!-m-0 cursor-pointer",
                      "hover:bg-gray-50 hover:dark:bg-gray-900",
                    ]
                  : "",
              )}
            >
              <div
                className={cn(
                  "flex items-center rounded transition-all",
                  rowHeight,
                  "bg-blue-400/10 dark:bg-blue-900",
                  onValueChange
                    ? "group-hover:bg-blue-400/30 group-hover:dark:bg-blue-800"
                    : "",
                  {
                    "mb-0": index === visibleData.length - 1,
                    "duration-800": showAnimation,
                  },
                )}
                style={{ width: `${widths[index]}%` }}
              >
                <div
                  className={cn(
                    "absolute left-2 flex max-w-full items-center gap-2 pr-2",
                  )}
                >
                  {item.img && (
                    <div>
                      <div className="inline-flex rounded-[2px] overflow-hidden shadow-md saturate-[.9] h-[10px] w-[15px]">
                        {item.img}
                      </div>
                    </div>
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      className={cn(
                        "truncate whitespace-nowrap rounded text-sm",
                        "text-gray-900 dark:text-gray-50",
                        "hover:underline hover:underline-offset-2",
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.name ?? ""}
                    </a>
                  ) : (
                    <p
                      className={cn(
                        "truncate whitespace-nowrap text-sm",
                        "text-gray-900 dark:text-gray-50",
                      )}
                    >
                      {item.name}
                    </p>
                  )}
                </div>
              </div>
            </Component>
          ))}
        </div>
        <div>
          {visibleData.map((item, index) => (
            <div
              key={item.key ?? item.name}
              className={cn(
                "flex items-center justify-end",
                rowHeight,
                index === visibleData.length - 1 ? "mb-0" : "mb-1.5",
              )}
            >
              <p
                className={cn(
                  "truncate whitespace-nowrap text-sm leading-none",
                  "text-gray-900 dark:text-gray-50",
                )}
              >
                {valueFormatter(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>
      {sortedData.length > 10 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : `Show more (${remainingItems})`}
        </Button>
      )}
    </div>
  );
}

BarListInner.displayName = "BarList";

const BarList = React.forwardRef(BarListInner) as <T>(
  p: BarListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof BarListInner>;

export { BarList, type BarListProps };
