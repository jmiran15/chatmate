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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matches: any;
  path: string;
  chatbotId: string | undefined;
}) {
  if (!chatbotId) {
    return false;
  }

  return (
    matches
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (match: any) => match.handle && match.handle.PATH,
      )
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (match: any) => match.handle.PATH(chatbotId) === path,
      ).length > 0
  );
}
