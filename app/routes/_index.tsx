// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import { Hero } from "~/components/landing-page/hero";
import { HowItWorks } from "~/components/landing-page/how-it-works";
import { Features } from "~/components/landing-page/features";
import { FAQ } from "~/components/landing-page/faq";
import { Cta } from "~/components/landing-page/cta";
import { Navbar } from "~/components/navbar";

export const meta: MetaFunction = () => [{ title: "Chatmate" }];

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
          src="http://localhost:3000/4a91ed04-18e3-4f06-ab6c-a03c18f6720e/widget"
          title="chatbot-preview"
        />
        <script src="http://localhost:3000/iframeResizer.js"></script>

        <Hero />
        <HowItWorks />
        <Features />
        <FAQ />
        <Cta />
      </div>
    </div>
  );
}
