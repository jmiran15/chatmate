import { useMatches } from "@remix-run/react";
import { useMemo } from "react";
import { z } from "zod";
import type { User } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id],
  );
  return route?.data as Record<string, unknown>;
}

function isUser(user: unknown): user is User {
  return (
    user != null &&
    typeof user === "object" &&
    "email" in user &&
    typeof user.email === "string"
  );
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return false;
    }

    if (!urlObj.hostname) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

const COMMON_INVALID_TLDS = [
  "local",
  "invalid",
  "test",
  "example",
  "localhost",
];

export const WebsiteSchema = z
  .string()
  .min(1, "Please enter your website URL")
  .transform((url) => {
    // Normalize URL
    let normalized = url.trim().toLowerCase();
    // Add https if no protocol
    if (!normalized.startsWith("http")) {
      normalized = `https://${normalized}`;
    }
    // Force HTTPS
    normalized = normalized.replace(/^http:/, "https:");
    // Remove trailing slash
    return normalized.replace(/\/+$/, "");
  })
  .pipe(
    z.string().refine(
      (url) => {
        try {
          const parsed = new URL(url);
          // Validate hostname
          const hostname = parsed.hostname;

          // Check for IP addresses
          if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
            return false;
          }

          // Check for invalid TLDs
          const tld = hostname.split(".").pop()?.toLowerCase();
          if (!tld || COMMON_INVALID_TLDS.includes(tld)) {
            return false;
          }

          return (
            parsed.protocol === "https:" &&
            !parsed.pathname.slice(1) && // no path
            !parsed.search && // no query params
            /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(hostname) // valid domain
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "Please enter a valid business website URL (e.g., https://example.com)",
      },
    ),
  );

export function getWebsiteError(url: string): string | null {
  try {
    if (!url) return "Please enter your website URL";

    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);

    if (parsed.pathname.length > 1) {
      return "Please enter your website's main domain without any paths";
    }

    if (parsed.search) {
      return "Please enter your website's main domain without any parameters";
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
      return "IP addresses are not allowed. Please enter your website's domain name";
    }

    const tld = parsed.hostname.split(".").pop()?.toLowerCase();
    if (tld && COMMON_INVALID_TLDS.includes(tld)) {
      return `".${tld}" is not a valid domain ending. Please enter your actual business website`;
    }

    return null;
  } catch {
    return "Please enter a valid website URL (e.g., example.com)";
  }
}
