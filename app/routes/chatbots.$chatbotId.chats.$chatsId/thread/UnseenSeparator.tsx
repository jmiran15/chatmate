// UnseenSeparator.tsx
import React from "react";

interface UnseenSeparatorProps {
  count: number;
}

export const UnseenSeparator: React.FC<UnseenSeparatorProps> = ({ count }) => {
  return (
    <div className="text-center py-2 bg-gray-100 text-gray-600 font-medium">
      {count} UNSEEN MESSAGES
    </div>
  );
};
