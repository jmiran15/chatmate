// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import { Hero } from "~/components/landing-page/hero";
import { HowItWorks } from "~/components/landing-page/how-it-works";
// import { Features } from "~/components/features";
import { FAQ } from "~/components/landing-page/faq";
import { Cta } from "~/components/landing-page/cta";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  return (
    <div className="orange-gradient">
      <div className="container relative">
        <Hero />
        <HowItWorks />
        {/* <Features /> */}
        <FAQ />
        <Cta />
      </div>
    </div>
  );
}
