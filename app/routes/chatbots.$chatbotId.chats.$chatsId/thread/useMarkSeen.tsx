import { useFetcher } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";

export const useMarkSeen = (
  chatId: string | undefined,
  seen: boolean | null,
) => {
  const fetcher = useFetcher({ key: `mark-seen-${chatId}` });
  const [hasMarkedSeen, setHasMarkedSeen] = useState(false);

  useEffect(() => {
    setHasMarkedSeen(seen === true);
  }, [chatId, seen]);

  const markSeen = useCallback(() => {
    if (!seen && !hasMarkedSeen && chatId) {
      fetcher.submit(
        { chatId, intent: "mark-seen" },
        {
          method: "post",
          preventScrollReset: true,
        },
      );
      setHasMarkedSeen(true);
    }
  }, [seen, hasMarkedSeen, chatId, fetcher]);

  return { markSeen, hasMarkedSeen };
};
