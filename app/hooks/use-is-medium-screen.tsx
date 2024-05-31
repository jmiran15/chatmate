import { useWindowSize } from "~/utils/mobile";

export const MD_MAX_WIDTH = 768; // based on tailwindcss breakpoint
export function useIsMediumScreen() {
  const { width } = useWindowSize();

  return width <= MD_MAX_WIDTH;
}
