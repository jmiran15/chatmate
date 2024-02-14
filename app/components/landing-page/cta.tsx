import { Link } from "@remix-run/react";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "~/lib/utils";

export const Cta = () => {
  return (
    <section id="cta" className="bg-muted/50 py-16 my-24 sm:my-32">
      <div className="container lg:grid lg:grid-cols-2 place-items-center">
        <div className="lg:col-start-1">
          <h2 className="text-3xl md:text-4xl font-bold ">
            Elevate Your
            <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              {" "}
              Customer Engagement{" "}
            </span>
            with Chatmate
          </h2>
          <p className="text-muted-foreground text-xl mt-4 mb-8 lg:mb-0">
            Transform how you interact with your site visitors using Chatmate.
            Our chatbot, powered by advanced AI like gpt-3.5-turbo, doesn't just
            answer questions - it proactively engages and converts visitors into
            customers. Get started for free and see your conversion rates soar!
          </p>
        </div>

        <div className="space-y-4 lg:col-start-2">
          <Link
            to="/join"
            className={cn("w-full md:mr-4 md:w-auto", buttonVariants())}
          >
            Create Your Chatbot
          </Link>
        </div>
      </div>
    </section>
  );
};
