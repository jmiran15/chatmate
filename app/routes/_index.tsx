// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import { Hero } from "~/components/landing-page/hero";
import { HowItWorks } from "~/components/landing-page/how-it-works";
import { Features } from "~/components/landing-page/features";
import { FAQ } from "~/components/landing-page/faq";
import { Cta } from "~/components/landing-page/cta";
import { Navbar } from "~/components/navbar";

export const meta: MetaFunction = () => [{ title: "Landing page" }];

export default function Index() {
  return (
    <div className="orange-gradient">
      <Navbar />
      {/* old widget */}
      {/* <script
          async
          src="dev-widget.js"
          data-chatbotid="e95f87ab-d525-4a8e-b9ca-4fe17e5c3d23"
          // data-chatbotid="69ea8261-bdfe-4d3d-b6a4-29f2d728b59e"
        ></script> */}
      <script
        data-embed-id="e95f87ab-d525-4a8e-b9ca-4fe17e5c3d23"
        src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
      ></script>
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <FAQ />
        <Cta />
      </main>
    </div>
  );
}

// import type { MetaFunction } from "@remix-run/node";
// import { Navbar } from "~/components/navbar";
// import { Hero } from "~/components/landing/hero";
// import { PrimaryFeatures } from "~/components/landing/primary-features";
// import { SecondaryFeatures } from "~/components/landing/secondary-features";
// import { CallToAction } from "~/components/landing/call-to-action";
// import { Faqs } from "~/components/landing/faq";
// import { Pricing } from "~/components/landing/pricing";
// import { Footer } from "~/components/landing/footer";

// export const meta: MetaFunction = () => [{ title: "Chatmate" }];

// export default function Index() {
//   return (
//     <>
//       <Navbar />
//       {/* widget */}
//       <script
//         data-embed-id="e95f87ab-d525-4a8e-b9ca-4fe17e5c3d23"
//         src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
//       ></script>
//       <main>
//         <Hero />
//         <PrimaryFeatures />
//         <SecondaryFeatures />
//         <CallToAction />
//         {/* <Pricing /> */}
//         <Faqs />
//       </main>
//       <Footer />
//     </>
//   );
// }
