import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Navbar } from "~/components/navbar";
import { Hero } from "~/components/landing/hero";
import { PrimaryFeatures } from "~/components/landing/primary-features";
import { SecondaryFeatures } from "~/components/landing/secondary-features";
import { Faqs } from "~/components/landing/faq";
import { Footer } from "~/components/landing/footer";
import PricingPage from "~/components/pricing-page";
import { requireUser } from "~/session.server";
import { createCheckoutSession } from "~/models/subscription.server";

export const meta: MetaFunction = () => [{ title: "Chatmate" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const price = String(formData.get("price"));

  // create a checkout session and redirect
  const url = await createCheckoutSession(user, price);

  return redirect(url);
};

export default function Index() {
  return (
    <>
      <Navbar />
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
