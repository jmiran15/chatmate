import { Button, buttonVariants } from "./ui/button";
import { Container } from "~/components/landing/container";
import { cn } from "~/lib/utils";
import { Form, Link } from "@remix-run/react";
import { Price, User } from "@prisma/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import H2 from "./landing/h2";
import H3 from "./landing/h3";
import { useOptionalUser } from "~/utils";
import { Loader2 } from "lucide-react";
import { useIsPending } from "~/hooks/use-is-pending";

export const PLANS = {
  FREE: "free",
  PRO: "pro",
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
        [CURRENCIES.USD]: 1990,
      },
      [INTERVALS.YEAR]: {
        [CURRENCIES.USD]: 19990,
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

function SwirlyDoodle(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 281 40"
      preserveAspectRatio="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M240.172 22.994c-8.007 1.246-15.477 2.23-31.26 4.114-18.506 2.21-26.323 2.977-34.487 3.386-2.971.149-3.727.324-6.566 1.523-15.124 6.388-43.775 9.404-69.425 7.31-26.207-2.14-50.986-7.103-78-15.624C10.912 20.7.988 16.143.734 14.657c-.066-.381.043-.344 1.324.456 10.423 6.506 49.649 16.322 77.8 19.468 23.708 2.65 38.249 2.95 55.821 1.156 9.407-.962 24.451-3.773 25.101-4.692.074-.104.053-.155-.058-.135-1.062.195-13.863-.271-18.848-.687-16.681-1.389-28.722-4.345-38.142-9.364-15.294-8.15-7.298-19.232 14.802-20.514 16.095-.934 32.793 1.517 47.423 6.96 13.524 5.033 17.942 12.326 11.463 18.922l-.859.874.697-.006c2.681-.026 15.304-1.302 29.208-2.953 25.845-3.07 35.659-4.519 54.027-7.978 9.863-1.858 11.021-2.048 13.055-2.145a61.901 61.901 0 0 0 4.506-.417c1.891-.259 2.151-.267 1.543-.047-.402.145-2.33.913-4.285 1.707-4.635 1.882-5.202 2.07-8.736 2.903-3.414.805-19.773 3.797-26.404 4.829Zm40.321-9.93c.1-.066.231-.085.29-.041.059.043-.024.096-.183.119-.177.024-.219-.007-.107-.079ZM172.299 26.22c9.364-6.058 5.161-12.039-12.304-17.51-11.656-3.653-23.145-5.47-35.243-5.576-22.552-.198-33.577 7.462-21.321 14.814 12.012 7.205 32.994 10.557 61.531 9.831 4.563-.116 5.372-.288 7.337-1.559Z"
      />
    </svg>
  );
}

function CheckIcon({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-6 w-6 flex-none fill-current stroke-current", className)}
      {...props}
    >
      <path
        d="M9.307 12.248a.75.75 0 1 0-1.114 1.004l1.114-1.004ZM11 15.25l-.557.502a.75.75 0 0 0 1.15-.043L11 15.25Zm4.844-5.041a.75.75 0 0 0-1.188-.918l1.188.918Zm-7.651 3.043 2.25 2.5 1.114-1.004-2.25-2.5-1.114 1.004Zm3.4 2.457 4.25-5.5-1.187-.918-4.25 5.5 1.188.918Z"
        strokeWidth={0}
      />
      <circle
        cx={12}
        cy={12}
        r={8.25}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Plan({
  name,
  price,
  price_id,
  features,
  canCheckout,
  button,
  to,
}: {
  name: string;
  price: string;
  price_id: string;
  features: string[];
  canCheckout: boolean;
  button: string;
  to: (user: User | null) => string;
}) {
  const user = useOptionalUser();
  const isPending = useIsPending({ intent: "createCheckout" });

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardTitle className="text-4xl">{price}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className={cn("order-last flex flex-col gap-y-3 text-primary")}>
          {features.map((feature) => (
            <li key={feature} className="flex">
              <CheckIcon className="text-primary" />
              <span className="ml-4">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {user && canCheckout ? (
          <Form
            method="post"
            action="/chatbots/settings/billing"
            className="w-full"
          >
            <input type="hidden" name="planId" value={price_id} />
            <input type="hidden" name="planInterval" value={INTERVALS.MONTH} />
            <Button
              type="submit"
              name="intent"
              value="createCheckout"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : button}
            </Button>
          </Form>
        ) : (
          <Link
            to={to(user)}
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            {button}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" aria-label="Pricing" className="bg-primary">
      <Container>
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <H2 className="text-white">
              <span className="relative whitespace-nowrap">
                <SwirlyDoodle className="absolute left-0 top-1/2 h-[1em] w-full fill-orange-400" />
                <span className="relative">Simple pricing,</span>
              </span>{" "}
              for everyone.
            </H2>
            <H3 className="text-white">
              It doesn’t matter what size your business is, our plans are
              designed to fit all your needs.
            </H3>
          </div>
          <div className="grid max-w-7xl w-full grid-cols-1 gap-x-10 gap-y-10 mx-auto lg:grid-cols-3 items-start">
            {plans.map((plan) => (
              <Plan
                key={plan.name}
                name={plan.name}
                price={plan.price}
                price_id={plan.price_id}
                features={plan.features}
                canCheckout={plan.canCheckout}
                button={plan.button}
                to={plan.to}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

const plans = [
  {
    name: "Everyone starts",
    price: "Free",
    price_id: "free",
    features: [
      "1 chatbot",
      "Unlimited chats",
      "Unlimited document uploads",
      "Widget customization",
      "Model customization",
      "AI chat insights",
      "AI follow ups",
    ],
    canCheckout: false,
    button: "Start for free",
    to: (user: User | null) => (user ? "/chatbots" : "/join"),
  },
  {
    name: "Pro",
    price: "$5/mo",
    price_id: "pro",
    features: [
      "Unlimited chatbots",
      "Unlimited chats",
      "Unlimited document uploads",
      "Widget customization",
      "Model customization",
      "AI chat insights",
      "AI follow ups",
      "24/7 customer support",
      "Analytics",
    ],
    button: "Start",
    canCheckout: true,
    to: (user: User | null) => "/join",
  },
  {
    name: "Enterprise",
    price: "Contact us",
    price_id: "enterprise",
    features: [
      "Everything in the pro plan",
      "Custom integrations",
      "Custom features",
    ],
    canCheckout: false,
    button: "Contact us",
    to: (user: User | null) => "mailto:info@chatmate.so",
  },
];
