// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import { Hero } from "~/components/landing-page/hero";
import { HowItWorks } from "~/components/landing-page/how-it-works";
import { Features } from "~/components/landing-page/features";
import { FAQ } from "~/components/landing-page/faq";
import { Cta } from "~/components/landing-page/cta";
import { Navbar } from "~/components/navbar";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  return (
    <div className="orange-gradient">
      <Navbar />
      <div className="container relative">
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
          src="https://chatmate.fly.dev/e95f87ab-d525-4a8e-b9ca-4fe17e5c3d23/widget"
          title="chatbot-preview"
        />
        <script src="http://chatmate.fly.dev/iframeResizer.js"></script>
        <Hero />
        <HowItWorks />
        <Features />
        <FAQ />
        <Cta />
      </div>
    </div>
  );
}
