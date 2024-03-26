import type { User } from "@prisma/client";

import { prisma } from "~/db.server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createBillingSession(user: User): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: "https://chatmate.so/chatbots",
  });
  return session.url;
}

export async function createCheckoutSession(
  user: User,
  price: string,
): Promise<string | null> {
  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    success_url: "https://chatmate.so/chatbots",
    cancel_url: "https://chatmate.so/#pricing",
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        userId: user.id,
      },
    },
  });

  return session.url;
}

export async function activeSubscription(user: User) {
  console.log(user);

  if (!user.stripeCustomerId) return false;
  if (!user.stripeSubscriptionId) return false;
  if (
    user.stripeSubscriptionStatus != "active" &&
    user.stripeSubscriptionStatus != "trialing"
  )
    return false;

  return true;
}

export async function handleWebhook(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  let event;
  const payload = await request.text();

  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.log(err);
    return new Response(err.message, {
      status: 400,
    });
  }

  if (
    event.type == "checkout.session.completed" ||
    event.type == "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.payment_status == "paid") {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription,
      );
      console.log("subscription: ", subscription);
      await handleSubscriptionCreated(session.customer, subscription);
    }
  }

  if (
    event.type == "customer.subscription.updated" ||
    event.type == "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    await updateSubscriptionStatus(
      subscription.metadata.userId,
      subscription.status,
    );
  }

  return {};
}

export async function subscriptionActive(user: User) {
  if (!user.stripeSubscriptionId) return false;
  if (user.stripeSubscriptionStatus == "canceled") return false;

  return true;
}

export async function handleSubscriptionCreated(
  stripeCustomerId: User["stripeCustomerId"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any,
) {
  await prisma.user.update({
    where: { id: subscription.metadata.userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });
}

export async function updateSubscriptionStatus(id: User["id"], status: string) {
  await prisma.user.update({
    where: { id },
    data: {
      stripeSubscriptionStatus: status,
    },
  });
}
