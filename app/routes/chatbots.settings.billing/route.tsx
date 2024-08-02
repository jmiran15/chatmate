import ChangePlan from "./change-plan";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import {
  createCustomerPortal,
  createSubscriptionCheckout,
} from "~/models/subscription.server";
import { requireUserId } from "~/session.server";
import { CURRENCIES } from "~/routes/_header._index/pricing-page";
import { prisma } from "~/db.server";
import ManageSubscription from "./manage-subscription";

export const meta: MetaFunction = () => {
  return [{ title: "Chatmate - Billing" }];
};

export const ROUTE_PATH = "/chatbots/settings/billing" as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return json({ subscription, currency: CURRENCIES.USD } as const);
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  switch (intent) {
    case "createCheckout": {
      const planId = String(formData.get("planId"));
      const planInterval = String(formData.get("planInterval"));
      const checkoutUrl = await createSubscriptionCheckout({
        userId,
        planId,
        planInterval,
      });
      if (!checkoutUrl) return json({ success: false } as const);
      return redirect(checkoutUrl);
    }
    case "createCustomerPortal": {
      const customerPortalUrl = await createCustomerPortal({
        userId,
      });
      if (!customerPortalUrl) return json({ success: false } as const);
      return redirect(customerPortalUrl);
    }
    default: {
      throw new Error("Invalid intent");
    }
  }
}

export default function BillingSettings() {
  return (
    <div className="grid gap-6">
      <ChangePlan />
      <ManageSubscription />
    </div>
  );
}
