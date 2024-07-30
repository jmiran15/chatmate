import { type MetaFunction } from "@remix-run/node";
import { Header } from "~/routes/_index/header";
import { Hero } from "~/routes/_index/hero";
import { PrimaryFeatures } from "~/routes/_index/primary-features";
import { SecondaryFeatures } from "~/routes/_index/secondary-features";
import { Faqs } from "~/routes/_index/faq";
import { Footer } from "~/routes/_index/footer";
import PricingPage from "~/routes/_index/pricing-page";

export const meta: MetaFunction = () => [
  { title: "Chatmate - AI Customer Support" },
];

export default function Index() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <PricingPage />
        <Faqs />
      </main>
      <Footer />
    </>
  );
}
