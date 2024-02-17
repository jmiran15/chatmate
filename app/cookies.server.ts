import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const widgetChat = createCookie("widgetChat", {
  maxAge: 604_800, // one week
  secure: true,
  sameSite: "none",
});
