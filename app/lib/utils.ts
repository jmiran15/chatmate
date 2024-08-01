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

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {},
) {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`;
}

export function formatBadgeNumber(value: number | string): string {
  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    return "0";
  }

  if (num <= 99) {
    return num.toString();
  }

  if (num <= 999) {
    return "99+";
  }

  if (num < 10000) {
    return `${Math.floor(num / 1000)}k+`;
  }

  return "9k+";
}
