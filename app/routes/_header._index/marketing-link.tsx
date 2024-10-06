import { useRef } from "react";
import { useHoverEffect } from "~/hooks/use-hover-effect";

export function MarketingLink({
  children,
  path,
  external = false,
  rounded = false,
}: {
  children: React.ReactNode;
  path: string;
  external?: boolean;
  rounded?: boolean;
}) {
  const elementRef = useRef(null);
  const Effect = useHoverEffect(elementRef, rounded);

  const handleClick = () => {
    if (external) {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = path;
    }
  };

  return (
    <button
      ref={elementRef}
      className="translate-0 group relative flex items-center gap-3 rounded-lg px-3 py-2"
      onClick={handleClick}
    >
      <div className="absolute inset-0 z-0">
        <Effect />
      </div>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
