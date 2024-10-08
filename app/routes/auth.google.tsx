// app/routes/auth.google.tsx
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "../utils/auth.server";

export let loader = () => redirect("/login");

export let action = ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate("google", request);
};
