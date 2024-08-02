import { useRef } from "react";
import { useHoverEffect } from "~/hooks/use-hover-effect";

export function MarketingLink({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) {
  const elementRef = useRef(null);
  const Effect = useHoverEffect(elementRef);

  return (
    <button
      ref={elementRef}
      className="translate-0 group relative flex items-center gap-3 rounded-lg px-3 py-2"
      onClick={() => (window.location.href = path)}
    >
      <Effect />
      {children}
    </button>
  );
}
