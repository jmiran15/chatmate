import { useEffect, useState } from "react";
import { useMousePosition } from "./use-mouse-position";

export function useHoverEffect(
  ref: React.RefObject<HTMLElement>,
  rounded: boolean = true,
) {
  const mousePosition = useMousePosition();
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || !mousePosition.x || !mousePosition.y) return;

    const rect = element.getBoundingClientRect();
    setOffsetX(mousePosition.x - rect.left - rect.width / 2);
    setOffsetY(mousePosition.y - rect.top - rect.height / 2);
  }, [mousePosition, ref]);

  return function Effect() {
    return (
      <div
        className="absolute inset-0 -z-10 bg-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:bg-muted group-hover:text-primary"
        style={{
          transform: `translate(${offsetX / 8}px, ${offsetY / 6}px)`,
          borderRadius: rounded ? "9999px" : "0.5rem",
        }}
      />
    );
  };
}
