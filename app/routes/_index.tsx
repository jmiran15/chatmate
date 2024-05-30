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
      {/* widget */}
      <script
        data-chatmate-widget-script="true"
        data-embed-id="45fa2e63-fd62-422f-ae83-383022baedc6"
        src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
      ></script>
      <main>
        <Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <PricingPage />
        {/* <CallToAction /> */}
        <Faqs />
      </main>
      <Footer />
    </>
  );
}
