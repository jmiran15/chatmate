import { cn } from "~/lib/utils";

interface EmptyStateProps {
  image: string;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({
  image,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full p-6",
        className,
      )}
    >
      <img
        src={image}
        alt={title}
        className="w-24 h-24 mb-4 object-contain"
        loading="lazy"
        decoding="async"
      />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {description}
      </p>
    </div>
  );
}
