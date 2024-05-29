import { prisma } from "~/db.server";
import Stripe from "stripe";
import { PLANS } from "~/components/pricing-page";

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
export async function createCustomer({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.customerId)
    throw new Error(`Stripe - Customer not created.`);

  const email = user.email ?? undefined;
  const customer = await stripe.customers
    .create({ email })
    .catch((err) => console.error(err));
  if (!customer) throw new Error(`Stripe - Customer not created.`);

  await prisma.user.update({
    where: { id: user.id },
    data: { customerId: customer.id },
  });
  return true;
}

/**
 * Creates a Stripe free tier subscription for a user.
 */
export async function createFreeSubscription({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.customerId)
    throw new Error("User has no Stripe customer ID.");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  if (subscription) return false;

  const currency = "usd";
  const plan = await prisma.plan.findUnique({
    where: { id: PLANS.FREE },
    include: { prices: true },
  });
  const yearlyPrice = plan?.prices.find(
    (price) => price.interval === "year" && price.currency === currency,
  );
  if (!yearlyPrice) throw new Error("No yearly price found.");

  const stripeSubscription = await stripe.subscriptions.create({
    customer: String(user.customerId),
    items: [{ price: yearlyPrice.id }],
  });
  if (!stripeSubscription) throw new Error("Something went wrong.");

  await prisma.subscription.create({
    data: {
      id: stripeSubscription.id,
      userId: user.id,
      planId: String(stripeSubscription.items.data[0].plan.product),
      priceId: String(stripeSubscription.items.data[0].price.id),
      interval: String(stripeSubscription.items.data[0].plan.interval),
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start,
      currentPeriodEnd: stripeSubscription.current_period_end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  return true;
}

/**
 * Creates a Stripe checkout session for a user.
 */
export async function createSubscriptionCheckout({
  userId,
  planId,
  planInterval,
}: {
  userId: string;
  planId: string;
  planInterval: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.customerId)
    throw new Error("User has no Stripe customer ID.");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  if (subscription?.planId !== PLANS.FREE) return;

  const currency = "usd";
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  });

  const price = plan?.prices.find(
    (price) => price.interval === planInterval && price.currency === currency,
  );
  if (!price) throw new Error("No price found.");

  const checkout = await stripe.checkout.sessions.create({
    customer: user.customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    mode: "subscription",
    payment_method_types: ["card"],
    success_url: `${HOST_URL}/chatbots/success`,
    cancel_url: `${HOST_URL}/chatbots/settings/billing`,
  });
  if (!checkout) throw new Error("Something went wrong.");
  return checkout.url;
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

// export async function activeSubscription(user: User) {
//   console.log(user);

//   if (!user.stripeCustomerId) return false;
//   if (!user.stripeSubscriptionId) return false;
//   if (
//     user.stripeSubscriptionStatus != "active" &&
//     user.stripeSubscriptionStatus != "trialing"
//   )
//     return false;

//   return true;
// }
