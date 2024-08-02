import { type MetaFunction } from "@remix-run/node";
import { Hero } from "~/routes/_header._index/hero";
import { PrimaryFeatures } from "~/routes/_header._index/primary-features";
import { SecondaryFeatures } from "~/routes/_header._index/secondary-features";
import { Faqs } from "~/routes/_header._index/faq";
import PricingPage from "~/routes/_header._index/pricing-page";

export const meta: MetaFunction = () => [
  { title: "Chatmate - AI Customer Support" },
];

export default function Index() {
  return (
    <main>
      <Hero />
      <PrimaryFeatures />
      <SecondaryFeatures />
      <PricingPage />
      <Faqs />
    </main>
  );
}
