import { useEffect, useState } from "react";

// New function to safely get window dimensions
function getWindowDimensions() {
  if (typeof window !== "undefined") {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    width: 0,
    height: 0,
  };
}

export function useWindowSize() {
  const [size, setSize] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setSize(getWindowDimensions());
    }

    // Set the initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 640; // based on tailwindcss breakpoint
export function useMobileScreen() {
  const { width } = useWindowSize();
  return width === 0 ? false : width <= MOBILE_MAX_WIDTH;
}
