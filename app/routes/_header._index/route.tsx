import { type MetaFunction } from "@remix-run/node";
import { Hero } from "~/routes/_header._index/hero";
import { PrimaryFeatures } from "~/routes/_header._index/primary-features";
import { SecondaryFeatures } from "~/routes/_header._index/secondary-features";
import { Faqs } from "~/routes/_header._index/faq";
import PricingPage from "~/routes/_header._index/pricing-page";
import { generateMetaTags, generateCanonicalUrl } from "~/utils/seo";

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
