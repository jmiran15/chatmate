// this is the landing page
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import ChatbotWidget from "./chatbots_.$chatbotId_.widget";

export const meta: MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  return (
    <div className="container relative ">
      <ChatbotWidget />
      <PageHeader>
        <PageHeaderHeading>
          10x your landing page conversion with a custom chatbot widget
        </PageHeaderHeading>
        <PageHeaderDescription>
          Join thousands of startups and enterprises who use Chatmate’s platform
          to increase their conversion rates
        </PageHeaderDescription>
        <PageActions>
          <Link to="/join" className={cn(buttonVariants())}>
            Get Started
          </Link>
        </PageActions>
      </PageHeader>
    </div>
  );
}
