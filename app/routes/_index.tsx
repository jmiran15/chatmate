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
        {/* the stuff people need to add to their code */}
        <iframe
          id="chatmate-chatbot-widget-iframe"
          style={{
            position: "fixed",
            bottom: "8px",
            right: "8px",
            zIndex: 50,
            height: "80px",
            width: "80px",
          }}
          src="http://localhost:3000/f21aefca-bd96-4f4f-bd92-08ab93f75491/widget"
          title="chatbot-preview"
        />
        <Hero />
        <HowItWorks />
        {/* <Features /> */}
        <FAQ />
        <Cta />
      </div>
    </div>
  );
}
