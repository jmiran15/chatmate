import type { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/db.server";
import { stripe } from "~/models/subscription.server";

export const ROUTE_PATH = "/webhook" as const;

/**
 * Gets and constructs a Stripe event signature.
 *
 * @throws An error if Stripe signature is missing or if event construction fails.
 * @returns The Stripe event object.
 */
async function getStripeEvent(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(`Stripe - Webhook secret is not initialized.`);
  }

  try {
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) throw new Error(`Stripe - Webhook signature is missing.`);
    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    return event;
  } catch (err: unknown) {
    console.log(err);
    throw new Error(`Stripe - Something went wrong.`);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const event = await getStripeEvent(request);

  try {
    switch (event.type) {
      /**
       * Occurs when a Checkout Session has been successfully completed.
       */
      case "checkout.session.completed": {
        const session = event.data.object;

        const { customer: customerId, subscription: newSubscriptionId } = z
          .object({ customer: z.string(), subscription: z.string() })
          .parse(session);

        const user = await prisma.user.findUnique({
          where: {
            customerId,
          },
        });
        if (!user) throw new Error(`User not found.`);

        console.log("customerId", customerId);
        console.log("newSubscriptionId", newSubscriptionId);

        // Retrieve all subscriptions for the customer
        const allSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
        });

        // Cancel all subscriptions except the newly created one
        for (const subscription of allSubscriptions.data) {
          if (subscription.id !== newSubscriptionId) {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`Cancelled subscription: ${subscription.id}`);
          }
        }

        // Retrieve and process the new subscription
        const newSubscription =
          await stripe.subscriptions.retrieve(newSubscriptionId);

        console.log("newSubscription", newSubscription);

        try {
          const dbSubscription = await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              id: newSubscription.id,
              userId: user.id,
              planId: String(newSubscription.items.data[0].plan.product),
              priceId: String(newSubscription.items.data[0].price.id),
              interval: String(newSubscription.items.data[0].plan.interval),
              status: newSubscription.status,
              currentPeriodStart: newSubscription.current_period_start,
              currentPeriodEnd: newSubscription.current_period_end,
              cancelAtPeriodEnd: newSubscription.cancel_at_period_end,
            },
            create: {
              id: newSubscription.id,
              userId: user.id,
              planId: String(newSubscription.items.data[0].plan.product),
              priceId: String(newSubscription.items.data[0].price.id),
              interval: String(newSubscription.items.data[0].plan.interval),
              status: newSubscription.status,
              currentPeriodStart: newSubscription.current_period_start,
              currentPeriodEnd: newSubscription.current_period_end,
            },
          });

          console.log("dbSubscription", dbSubscription);
        } catch (err: unknown) {
          console.log(err);
        }

        return new Response(null);
      }

      /**
       * Occurs when a Stripe subscription has been updated.
       * E.g. when a user upgrades or downgrades their plan.
       */
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const { customer: customerId } = z
          .object({ customer: z.string() })
          .parse(subscription);

        const user = await prisma.user.findUnique({ where: { customerId } });
        if (!user) throw new Error(`Stripe - User not found.`);

        await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            id: subscription.id,
            userId: user.id,
            planId: String(subscription.items.data[0].plan.product),
            priceId: String(subscription.items.data[0].price.id),
            interval: String(subscription.items.data[0].plan.interval),
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });

        return new Response(null);
      }

      /**
       * Occurs whenever a customer’s subscription ends.
       */
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { id } = z.object({ id: z.string() }).parse(subscription);

        const dbSubscription = await prisma.subscription.findUnique({
          where: { id },
        });
        if (dbSubscription)
          await prisma.subscription.delete({
            where: { id: dbSubscription.id },
          });

        return new Response(null);
      }
    }
  } catch (err: unknown) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { customer: customerId, subscription: subscriptionId } = z
          .object({ customer: z.string(), subscription: z.string() })
          .parse(session);

        const user = await prisma.user.findUnique({ where: { customerId } });
        if (!user) throw new Error(`Stripe - User not found.`);

        // await sendSubscriptionErrorEmail({ email: user.email, subscriptionId });
        return new Response(null);
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: subscriptionId, customer: customerId } = z
          .object({ id: z.string(), customer: z.string() })
          .parse(subscription);

        const user = await prisma.user.findUnique({ where: { customerId } });
        if (!user) throw new Error(`Stripe - User not found.`);

        // await sendSubscriptionErrorEmail({ email: user.email, subscriptionId });
        return new Response(null);
      }
    }

    throw err;
  }

  return new Response(null);
}
