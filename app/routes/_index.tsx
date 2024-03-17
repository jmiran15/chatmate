import type { MetaFunction } from "@remix-run/node";
import { Navbar } from "~/components/navbar";
import { Hero } from "~/components/landing/hero";
import { PrimaryFeatures } from "~/components/landing/primary-features";
import { SecondaryFeatures } from "~/components/landing/secondary-features";
import { CallToAction } from "~/components/landing/call-to-action";
import { Faqs } from "~/components/landing/faq";
import { Footer } from "~/components/landing/footer";

export const meta: MetaFunction = () => [{ title: "Chatmate" }];

export default function Index() {
  return (
    <>
      <Navbar />
      {/* widget */}
      <script
        data-embed-id="e95f87ab-d525-4a8e-b9ca-4fe17e5c3d23"
        src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
      ></script>
      <main>
        <Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <Faqs />
      </main>
      <Footer />
    </>
  );
}
