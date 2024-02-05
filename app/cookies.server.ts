import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const layoutPanel = createCookie("layout");
export const collapsedPanel = createCookie("collapsed");
