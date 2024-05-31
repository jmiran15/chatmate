import { type MetaFunction } from "@remix-run/node";
import { Header } from "~/components/layout/header";
import { Hero } from "~/components/landing/hero";
import { PrimaryFeatures } from "~/components/landing/primary-features";
import { SecondaryFeatures } from "~/components/landing/secondary-features";
import { Faqs } from "~/components/landing/faq";
import { Footer } from "~/components/landing/footer";
import PricingPage from "~/components/pricing-page";

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
