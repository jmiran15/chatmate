import { useMatches } from "@remix-run/react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isActive({
  matches,
  path,
  chatbotId,
}: {
  matches: ReturnType<typeof useMatches>;
  path: string;
  chatbotId: string | undefined;
}) {
  if (!chatbotId) {
    return false;
  }

  return (
    matches
      .filter((match) => match.handle && match.handle.PATH)
      .filter((match) => match.handle.PATH(chatbotId) === path).length > 0
  );
}
