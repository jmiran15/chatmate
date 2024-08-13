import React, { useRef, useState, useEffect } from "react";

export function TableWrapper({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1); // Subtract 1 to account for potential rounding errors
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  return (
    <div className="relative w-full overflow-hidden my-8 rounded-lg shadow-md border">
      <div
        ref={scrollRef}
        className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        onScroll={checkScroll}
      >
        <div className="inline-block min-w-full ">{children}</div>
      </div>
      {showLeftShadow && (
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none rounded-l-lg" />
      )}
      {showRightShadow && (
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none rounded-r-lg" />
      )}
    </div>
  );
}
