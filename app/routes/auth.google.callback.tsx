// app/routes/auth.google.callback.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "../utils/auth.server";

export let loader = ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate("google", request, {
    successRedirect: "/chatbots",
    failureRedirect: "/login",
  });
};
