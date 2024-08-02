import { PrismaClient } from "@prisma/client";
import { stripe } from "~/models/subscription.server";
import {
  Interval,
  PLANS,
  PRICING_PLANS,
} from "~/routes/_header._index/pricing-page";

const prisma = new PrismaClient();

async function seed() {
  // stripe
  const products = await stripe.products.list({
    active: true,
    limit: 3,
  });

  if (products?.data?.length) {
    console.info(
      `🏃‍♂️ Skipping Stripe products creation and seeding. ${products?.data
        ?.length} Products - ${products?.data?.map((product) => product.name)}`,
    );
    return true;
  }

  const seedProducts = Object.values(PRICING_PLANS).map(
    async ({ id, name, description, prices }) => {
      // Format prices to match Stripe's API.
      const pricesByInterval = Object.entries(prices).flatMap(
        ([interval, price]) => {
          return Object.entries(price).map(([currency, amount]) => ({
            interval,
            currency,
            amount,
          }));
        },
      );

      // Create Stripe product.
      await stripe.products.create({
        id,
        name,
        description: description || undefined,
      });

      // Create Stripe price for the current product.
      const stripePrices = await Promise.all(
        pricesByInterval.map((price) => {
          return stripe.prices.create({
            product: id,
            currency: price.currency ?? "usd",
            unit_amount: price.amount ?? 0,
            tax_behavior: "inclusive",
            recurring: {
              interval: (price.interval as Interval) ?? "month",
            },
          });
        }),
      );

      // Store product into database.
      await prisma.plan.create({
        data: {
          id,
          name,
          description,
          prices: {
            create: stripePrices.map((price) => ({
              id: price.id,
              amount: price.unit_amount ?? 0,
              currency: price.currency,
              interval: price.recurring?.interval ?? "month",
            })),
          },
        },
      });

      // Return product ID and prices.
      // Used to configure the Customer Portal.
      return {
        product: id,
        prices: stripePrices.map((price) => price.id),
      };
    },
  );

  // Create Stripe products and stores them into database.
  const seededProducts = await Promise.all(seedProducts);
  console.info(`📦 Stripe Products has been successfully created.`);

  // Configure Customer Portal.
  await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Organization Name - Customer Portal",
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["address", "shipping", "tax_id", "email"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "always_invoice",
        products: seededProducts.filter(
          ({ product }) => product !== PLANS.FREE,
        ),
      },
    },
  });

  console.info(`👒 Stripe Customer Portal has been successfully configured.`);
  console.info(
    "🎉 Visit: https://dashboard.stripe.com/test/products to see your products.",
  );

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
