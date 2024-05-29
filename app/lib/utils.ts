import { useMatches } from "@remix-run/react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Handle {
  breadcrumb?: string;
}

export function isActive(matches: ReturnType<typeof useMatches>, path: string) {
  return matches.filter((match) =>
    match.handle ? (match.handle as Handle).breadcrumb === path : false,
  ).length;
}
