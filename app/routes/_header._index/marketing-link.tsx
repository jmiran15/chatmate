import { useRef } from "react";
import { useHoverEffect } from "~/hooks/use-hover-effect";

export function MarketingLink({
  children,
  path,
  external = false,
}: {
  children: React.ReactNode;
  path: string;
  external?: boolean;
}) {
  const elementRef = useRef(null);
  const Effect = useHoverEffect(elementRef);

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
      <Effect />
      {children}
    </button>
  );
}
