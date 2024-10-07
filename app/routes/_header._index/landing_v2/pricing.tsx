import { Button, buttonVariants } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import Section from "./section";

import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import { cn } from "~/lib/utils";
import { useOptionalUser } from "~/utils";
import { loader } from "../route";
import useWindowSize from "./hooks/use-window-size";

// TODO: integrate this with our actual stripe pricing. Use price ids based on env.
// in dev, use test mode price ids, in prod, use prod price ids.
// we can get this stuff from loader (env)

// Hardcoding test price ids for now

// export const priceIds = {
//   hobby: {
//     month: "price_1Q58gaFSz9CUblnBlDIarRjt",
//     year: "price_1Q58gaFSz9CUblnBslgqB2PG",
//   },
//   standard: {
//     month: "price_1Q58hHFSz9CUblnBdbnkLfn6",
//     year: "price_1Q58hHFSz9CUblnBXjudBDis",
//   },
//   unlimited: {
//     month: "price_1Q58hwFSz9CUblnBuCdk4sRy",
//     year: "price_1Q58hwFSz9CUblnBLNFh0kqn",
//   },
// };

// export const pricing = [
//   {
//     planId: "prod_Qx2m9UluIRTRRL",
//     name: "Hobby",
//     price: "$19",
//     period: "month",
//     yearlyPrice: "$190",
//     features: [
//       "1 chatbot",
//       "Unlimited chats",
//       "Unlimited training data",
//       "Live chat support",
//       "Advanced analytics",
//       "Custom lead forms",
//       "Custom flows",
//       "Widget customization",
//       "AI model customization",
//     ],
//     description: "Perfect for individuals and small projects",
//     buttonText: "Start free trial",
//     isPopular: false,
//     monthlyPriceId: priceIds.hobby.month,
//     yearlyPriceId: priceIds.hobby.year,
//     chatbotsLimit: 1,
//   },
//   {
//     planId: "prod_Qx2mIRb2RYweno",
//     name: "Standard",
//     price: "$39",
//     period: "month",
//     yearlyPrice: "$390",
//     features: [
//       "5 chatbots",
//       "Unlimited chats",
//       "Unlimited training data",
//       "Live chat support",
//       "Advanced analytics",
//       "Custom lead forms",
//       "Custom flows",
//       "Widget customization",
//       "AI model customization",
//     ],
//     description: "Ideal for growing businesses and teams",
//     buttonText: "Start free trial",
//     isPopular: true,
//     monthlyPriceId: priceIds.standard.month,
//     yearlyPriceId: priceIds.standard.year,
//     chatbotsLimit: 5,
//   },
//   {
//     planId: "prod_Qx2nOvv0JgNpOa",
//     name: "Unlimited",
//     price: "$79",
//     period: "month",
//     yearlyPrice: "$790",
//     features: [
//       "Unlimited chatbots",
//       "Unlimited chats",
//       "Unlimited training data",
//       "Live chat support",
//       "Advanced analytics",
//       "Custom lead forms",
//       "Custom flows",
//       "Widget customization",
//       "AI model customization",
//     ],
//     description: "For large-scale operations and high-volume users",
//     buttonText: "Start free trial",
//     isPopular: false,
//     monthlyPriceId: priceIds.unlimited.month,
//     yearlyPriceId: priceIds.unlimited.year,
//     chatbotsLimit: Infinity,
//   },
// ];

export default function PricingSection() {
  const { pricing } = useLoaderData<typeof loader>();
  const [isMonthly, setIsMonthly] = useState(true);
  const { isDesktop } = useWindowSize();
  const fetcher = useFetcher({ key: "subscribe" });
  const navigate = useNavigate();
  const isPending =
    fetcher.state === "submitting" &&
    fetcher.formData &&
    fetcher.formData.get("intent") === "createCheckout";

  const handleToggle = () => {
    setIsMonthly(!isMonthly);
  };

  const user = useOptionalUser();

  function handleCheckout({ priceId }: { priceId: string }) {
    if (user) {
      // submit request to /chatbots/settings/billing with the price Id so that it creates a checkout session and redirects
      fetcher.submit(
        {
          intent: "createCheckout",
          priceId,

          successUrl: "/chatbots?success=true",
          cancelUrl: "/",
        },
        { method: "POST", action: "/chatbots/settings/billing" },
      );
    } else {
      navigate("/join?priceId=" + priceId);
    }
  }

  return (
    <Section
      id="pricing"
      title="Pricing"
      subtitle="Choose the plan that's right for you"
    >
      <div className="flex justify-center mb-10">
        <span className="mr-2 font-semibold">Monthly</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch checked={!isMonthly} onCheckedChange={handleToggle} />
          </Label>
        </label>
        <span className="ml-2 font-semibold">Yearly</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {pricing.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: 0,
                    opacity: 1,
                    x:
                      index === pricing.length - 1 ? -30 : index === 0 ? 30 : 0,
                    scale:
                      index === 0 || index === pricing.length - 1 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              `rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`,
              plan.isPopular
                ? "border-orange-500 border-[2px]"
                : "border-border",
              index === 0 || index === pricing.length - 1
                ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]"
                : "z-10",
              index === 0 && "origin-right",
              index === pricing.length - 1 && "origin-left",
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-orange-500 py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <FaStar className="text-white" />
                <span className="text-white ml-1 font-sans font-semibold">
                  Popular
                </span>
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-muted-foreground">
                {plan.name}
              </p>
              <p className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {isMonthly ? plan.price : plan.yearlyPrice}
                </span>
                {plan.period !== "Next 3 months" && (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                    / {isMonthly ? "month" : "year"}
                  </span>
                )}
              </p>

              <p className="text-xs leading-5 text-muted-foreground">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-5 gap-2 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-orange-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4" />

              <Button
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-orange-500 hover:ring-offset-1 hover:bg-orange-500 hover:text-white",
                  plan.isPopular
                    ? "bg-orange-500 text-white"
                    : "bg-white text-black",
                )}
                type="button"
                onClick={() =>
                  handleCheckout({
                    priceId: isMonthly
                      ? plan.monthlyPriceId
                      : plan.yearlyPriceId,
                  })
                }
                disabled={
                  isPending &&
                  fetcher.formData?.get("priceId") ===
                    (isMonthly ? plan.monthlyPriceId : plan.yearlyPriceId)
                }
              >
                {isPending &&
                fetcher.formData?.get("priceId") ===
                  (isMonthly ? plan.monthlyPriceId : plan.yearlyPriceId) ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  plan.buttonText
                )}
              </Button>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
