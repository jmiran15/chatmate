import { useEffect, useState } from "react";
import { useMousePosition } from "./use-mouse-position";

export function useHoverEffect(ref) {
  const mousePosition = useMousePosition();
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!mousePosition.x || !mousePosition.y) return;
    const rect = element.getBoundingClientRect();
    setOffsetX(mousePosition.x - rect.left - rect.width / 2);
    setOffsetY(mousePosition.y - rect.top - rect.height / 2);
  }, [mousePosition, ref]);
  return function Effect() {
    return (
      <div
        className="absolute inset-0 -z-10 translate-x-[var(--x)] translate-y-[var(--y)] opacity-0 transition-opacity duration-200 group-hover:bg-muted group-hover:opacity-100 group-hover:text-primary rounded-lg"
        style={{
          "--x": `${offsetX / 8}px`,
          "--y": `${offsetY / 6}px`,
        }}
      />
    );
  };
}
