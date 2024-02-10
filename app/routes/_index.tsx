// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import ChatbotWidget from "./chatbots_.$chatbotId_.widget";
import { Hero } from "~/components/hero";
// import { Sponsors } from "~/components/sponsors";
import { HowItWorks } from "~/components/how-it-works";
// import { Features } from "~/components/features";
import { FAQ } from "~/components/faq";
import { Cta } from "~/components/cta";
// import { Testimonials } from "~/components/testimonials";
// import { Pricing } from "~/components/pricing";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  return (
    <div className="orange-gradient">
      <div className="container relative">
        <ChatbotWidget />
        <Hero />
        {/* <Sponsors /> */}
        <HowItWorks />
        {/* <Features /> */}
        <div>features</div>
        {/* <Testimonials /> */}
        {/* <Pricing /> */}
        <FAQ />
        <Cta />
      </div>
    </div>
  );
}
