import { Link } from "@remix-run/react";
import { Button, buttonVariants } from "../ui/button";
import Balance from "react-wrap-balancer";
import { cn } from "~/lib/utils";

export const Hero = () => {
  return (
    <section className="container py-20 md:py-32">
      <Balance>
        <div className="mx-auto text-center space-y-6">
          <main className="font-bold">
            <h1 className="text-5xl md:text-6xl inline">
              <Balance>
                <span className="text-primary font-extrabold">10x</span> your
                landing page conversion with a custom{" "}
                <span className="text-primary font-extrabold">
                  chatbot widget
                </span>
              </Balance>
            </h1>
          </main>

          <p className="text-xl text-muted-foreground md:w-10/12 mx-auto">
            <Balance>
              Join thousands of startups and enterprises that have transformed
              their user engagement with Chatmate’s AI-powered chatbot.
              Experience seamless integration, real-time analytics, and 24/7
              automated customer service that feels personal and boosts your
              conversion rates.
            </Balance>
          </p>

          <div className="flex justify-center space-x-4">
            {" "}
            {/* Flexbox with centering */}
            <Link to="/join" className={cn(buttonVariants())}>
              Get Started
            </Link>
            <Button variant="outline">Try the demo</Button>
          </div>
        </div>
      </Balance>
    </section>
  );
};
