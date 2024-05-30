import { Price } from "@prisma/client";
import { prisma } from "~/db.server";
import { stripe } from "~/models/subscription.server";

export const PLANS = {
  FREE: `free`,
  PRO: `pro`,
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const INTERVALS = {
  MONTH: "month",
  YEAR: "year",
} as const;

export type Interval = (typeof INTERVALS)[keyof typeof INTERVALS];

type PricingPlan<T extends Plan = Plan> = {
  [key in T]: {
    id: string;
    name: string;
    description: string;
    prices: PriceInterval;
  };
};

export const CURRENCIES = {
  DEFAULT: "usd",
  USD: "usd",
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

export const PRICING_PLANS = {
  [PLANS.FREE]: {
    id: PLANS.FREE,
    name: "Free",
    description: "Start with the basics, upgrade anytime.",
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 0,
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 0,
      },
    },
  },
  [PLANS.PRO]: {
    id: PLANS.PRO,
    name: "Pro",
    description: "Access to all features and unlimited projects.",
    prices: {
      [INTERVALS.MONTH]: {
        [CURRENCIES.USD]: 500,
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 5000,
      },
    },
  },
} satisfies PricingPlan;

type PriceInterval<
  I extends Interval = Interval,
  C extends Currency = Currency,
> = {
  [interval in I]: {
    [currency in C]: Price["amount"];
  };
};

export async function seed() {
  // stripe
  const products = await stripe.products.list({
    active: true,
    limit: 3,
  });

  console.info(`🌱 Seeding database...`);

  console.info(`🔍 Checking for existing Stripe products...`);

  if (products?.data?.length) {
    console.info(
      `🏃‍♂️ Skipping Stripe products creation and seeding. ${products?.data
        ?.length} Products - ${products?.data?.map((product) => product.name)}`,
    );
    return true;
  }

  console.info(`🚀 Creating Stripe products...`);

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
      console.info(
        `🌱 Creating product: ${name} with ${pricesByInterval.length} prices.`,
      );

      // Create Stripe product.
      await stripe.products.create({
        id,
        name,
        description: description || undefined,
      });

      console.info(`🌱 Creating prices for product: ${name}.`);

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

      console.info(
        `🌱 Prices for product: ${name} has been successfully created.`,
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

      console.info(`🌱 Product: ${name} has been successfully created.`);

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
