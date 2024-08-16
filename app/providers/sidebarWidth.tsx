import React, { createContext, useContext, useState } from "react";

type SidebarWidthContextType = {
  sidebarWidth: number | null;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number | null>>;
};

const SidebarWidthContext = createContext<SidebarWidthContextType | undefined>(
  undefined,
);

export const SidebarWidthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);

  return (
    <SidebarWidthContext.Provider value={{ sidebarWidth, setSidebarWidth }}>
      {children}
    </SidebarWidthContext.Provider>
  );
};

export const useSidebarWidth = () => {
  const context = useContext(SidebarWidthContext);
  if (context === undefined) {
    throw new Error(
      "useSidebarWidth must be used within a SidebarWidthProvider",
    );
  }
  return context;
};
