import { Link } from "@remix-run/react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useOptionalUser } from "~/utils";
import Section from "./section";

export default function CtaSection() {
  const user = useOptionalUser();
  return (
    <Section
      id="cta"
      title="Ready to get started?"
      subtitle="Start your free trial today."
      className="bg-orange-500/10 rounded-xl py-16"
    >
      <div className="flex flex-col w-full sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
        <Link
          className={cn(
            buttonVariants({ variant: "default" }),
            "relative text-white p-7 text-xl font-semibold shadow-lg",
            "transition duration-300 ease-in-out",
            "hover:scale-105 hover:shadow-inner hover:shadow-white/30",
            "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50",
            "w-full sm:w-auto text-background flex gap-2",
            "bg-orange-500 hover:bg-orange-600",
          )}
          to={user ? "/chatbots" : "/join"}
        >
          <span className="relative z-10">
            {user ? "My chatbots" : "Start for free"}
          </span>
        </Link>
      </div>
    </Section>
  );
}
