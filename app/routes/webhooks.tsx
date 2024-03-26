import { ActionFunctionArgs } from "@remix-run/node";
import { handleWebhook } from "~/models/subscription.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    return await handleWebhook(request);
  } catch (e) {
    console.log(e);
    return e;
  }
};
