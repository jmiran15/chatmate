import { json, type MetaFunction } from "@remix-run/node";
import { getPricing } from "~/utils/pricing.server";
import { generateCanonicalUrl, generateMetaTags } from "~/utils/seo";
import CtaSection from "./landing_v2/CTA";
import FAQ from "./landing_v2/FAQ";
import Hero2 from "./landing_v2/hero";
import HowItWorks from "./landing_v2/how-it-works";
import Logos from "./landing_v2/logos";
import PricingSection from "./landing_v2/pricing";
import SecondaryFeatures from "./landing_v2/secondary-features";
import { Stats } from "./landing_v2/stats";
import Testimonials from "./landing_v2/testimonials";

export const meta: MetaFunction = ({ location }) => {
  const canonicalUrl = generateCanonicalUrl(location.pathname);
  return [
    ...generateMetaTags({
      title: "Chatmate - AI Customer Support | Chatbots for Websites",
      description:
        "Enhance your customer support with Chatmate's AI-powered chatbots. Solve 80% of customer inquiries instantly and improve user experience.",
      url: canonicalUrl,
      type: "website",
    }),
  ];
};

export const loader = async () => {
  const pricing = getPricing();
  return json(pricing);
};

export default function Index() {
  return (
    <main className="font-inter">
      <Hero2 />
      <Logos />
      <HowItWorks />
      <Stats />
      <SecondaryFeatures />
      <Testimonials />
      <PricingSection />
      <FAQ />
      <CtaSection />
    </main>
  );
}
