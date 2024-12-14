import Stripe from "stripe";
import { prisma } from "~/db.server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY must be set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const HOST_URL =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_BASE
    : process.env.PROD_BASE;

/**
 * Creates a Stripe customer for a user.
 */
export async function createCustomer({
  userId,
  website,
}: {
  userId: string;
  website: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.customerId)
    throw new Error(`Stripe - Customer not created.`);

  const email = user.email ?? undefined;
  const customer = await stripe.customers
    .create({ email, metadata: { website } })
    .catch((err) => console.error(err));
  if (!customer) throw new Error(`Stripe - Customer not created.`);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { customerId: customer.id },
  });

  return updatedUser;
}

/**
 * Creates a Stripe checkout session for a user.
 */
export async function createSubscriptionCheckout({
  userId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.customerId)
      throw new Error("User has no Stripe customer ID.");

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    if (subscription?.priceId === priceId) {
      // throw new Error("You are already subscribed to this tier");
      // TODO: redirect to customer portal
      const customerPortal = await createCustomerPortal({ userId });
      return customerPortal;
    }

    const checkout = await stripe.checkout.sessions.create({
      customer: user.customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      // payment_method_types: ["card"],
      success_url: `${HOST_URL}${successUrl}`,
      cancel_url: `${HOST_URL}${cancelUrl}`,
      ...(!subscription?.priceId
        ? {
            subscription_data: {
              trial_period_days: 7,
            },
          }
        : {}), // only add trial if no prior subscription exists
    });

    console.log("checkut: ", checkout);
    if (!checkout) throw new Error("Unable to create checkout session");
    return checkout.url;
  } catch (cause) {
    throw new Error("Unable to create checkout session " + cause);
  }
}

/**
 * Creates a Stripe customer portal for a user.
 */
export async function createCustomerPortal({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.customerId)
    throw new Error("User has no Stripe customer ID.");

  const customerPortal = await stripe.billingPortal.sessions.create({
    customer: user.customerId,
    return_url: `${HOST_URL}/chatbots/settings/billing`,
  });
  if (!customerPortal) throw new Error("Something went wrong.");
  return customerPortal.url;
}
