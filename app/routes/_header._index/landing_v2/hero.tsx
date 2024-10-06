import { motion } from "framer-motion";

import { Link } from "@remix-run/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { AvatarCirclesDemo } from "./avatar-testomnial";
import HeroSlider from "./hero-slider";

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { useOptionalUser } from "~/utils";

const ease = [0.16, 1, 0.3, 1];

function HeroTitles() {
  return (
    <div className="flex w-full max-w-6xl flex-col space-y-4 overflow-hidden pt-8">
      <motion.h1
        className="text-center text-4xl font-medium leading-tight text-foreground sm:text-5xl md:text-6xl"
        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
        animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          ease,
          staggerChildren: 0.2,
        }}
      >
        {/* Simple AI chat widget to instantly answer questions and collect qualified leads on your website. */}
        {[
          "AI chat widget to instantly",
          "answer questions",
          "on your website.",
        ].map((text, index) => {
          return text === "AI chat widget to instantly" ? (
            <motion.span
              key={index}
              className="inline-block px-1 md:px-2 text-balance font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease,
              }}
            >
              {"AI chat widget to "}{" "}
              <span className="relative whitespace-nowrap text-orange-500">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute left-0 top-2/3 h-[0.58em] w-full fill-orange-300/70"
                  preserveAspectRatio="none"
                >
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">Instantly</span>
              </span>
            </motion.span>
          ) : (
            <motion.span
              key={index}
              className="inline-block px-1 md:px-2 text-balance font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease,
              }}
            >
              {text}
            </motion.span>
          );
        })}
      </motion.h1>
      <motion.p
        className="mx-auto max-w-5xl text-center text-lg leading-7 text-muted-foreground sm:text-xl sm:leading-9 text-balance"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease,
        }}
      >
        Chatmate allows you to create a customizable AI chatbot widget that
        instantly answers user questions and collects qualified leads using your
        business information.
      </motion.p>
    </div>
  );
}

function HeroCTA() {
  const user = useOptionalUser();

  return (
    <>
      <motion.div
        className="mx-auto mt-6 flex w-full max-w-2xl flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease }}
      >
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
        <Button
          data-cal-namespace="demo"
          data-cal-link="jonathanmiranda/demo"
          data-cal-config='{"layout":"month_view"}'
          variant="secondary"
          className={cn(
            "relative p-7 text-xl font-semibold shadow-lg",
            "transition duration-300 ease-in-out",
            "hover:scale-105 ",
            "focus:outline-none focus:ring-2 focus:ring-opacity-50",
            "w-full sm:w-auto flex gap-2",
            "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="relative z-10">Book a demo</span>
        </Button>
      </motion.div>
      <motion.p
        className="mt-5 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
      >
        Get started with your 7 day free trial now
      </motion.p>
    </>
  );
}
export default function Hero2() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "demo" });
      cal("ui", {
        styles: { branding: { brandColor: "#f97316" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <section id="hero" className="border-b border-border">
      <div className="relative flex w-full flex-col items-center justify-start px-4 pt-24 sm:pt-28 md:pt-32 lg:px-8">
        <HeroTitles />
        <HeroCTA />
        <AvatarCirclesDemo />
        <HeroSlider />
      </div>
    </section>
  );
}
