import { useNavigate } from "@remix-run/react";
import { useRef } from "react";
import { useHoverEffect } from "~/hooks/use-hover-effect";

export function MarketingLink({ children, path }) {
  const elementRef = useRef(null);
  const Effect = useHoverEffect(elementRef);
  const navigate = useNavigate();

  return (
    <button
      ref={elementRef}
      className="translate-0 group relative flex items-center gap-3 rounded-lg px-3 py-2"
      onClick={() => navigate(path)}
    >
      <Effect />
      {children}
    </button>
  );
}
