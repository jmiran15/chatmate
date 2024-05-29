import { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import clsx from "clsx";

import { Container } from "./container";

import screenshotDocuments from "../../images/screenshots/data.png";
import screenshotAppearance from "../../images/screenshots/appearance.png";
import screenshotChats from "../../images/screenshots/chats.png";
import screenshotAnalytics from "../../images/screenshots/analytics.png";

const features = [
  {
    title: "Ground your AI agent",
    description:
      "Imbue your agent with your company’s identity, policies, processes, and knowledge – ensuring your agent represents the best of your business.",
    image: screenshotDocuments,
  },
  {
    title: "Customize",
    description:
      "Customize your chatbot widget to match your brand and website design. Add starter messages, follow-up questions, and more.",
    image: screenshotAppearance,
  },
  {
    title: "Gather AI insights",
    description:
      "Chatmate automatically generates key insights for each conversation, making it easy to track success and see what your customers are interested in most.",
    image: screenshotChats,
  },
  {
    title: "Analytics",
    description:
      "From conversation trends to resolution rates, gain a comprehensive view of your AI chatbot’s effectiveness in enhancing customer experience.",
    image: screenshotAnalytics,
  },
];

export function PrimaryFeatures() {
  const [tabOrientation, setTabOrientation] = useState<
    "horizontal" | "vertical"
  >("horizontal");

  useEffect(() => {
    const lgMediaQuery = window.matchMedia("(min-width: 1024px)");

    function onMediaQueryChange({ matches }: { matches: boolean }) {
      setTabOrientation(matches ? "vertical" : "horizontal");
    }

    onMediaQueryChange(lgMediaQuery);
    lgMediaQuery.addEventListener("change", onMediaQueryChange);

    return () => {
      lgMediaQuery.removeEventListener("change", onMediaQueryChange);
    };
  }, []);

  return (
    <section
      id="features"
      aria-label="Chatmate features"
      className="relative overflow-hidden bg-primary px-4 py-20 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            Make AI your own.
          </h2>
          <p className="mt-6 text-lg tracking-tight text-white">
            Chatmate’s AI platform enables your company to build an AI agent
            that is personalized to your business and customers.
          </p>
        </div>
        <Tab.Group
          as="div"
          className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
          vertical={tabOrientation === "vertical"}
        >
          {({ selectedIndex }) => (
            <>
              <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                <Tab.List className="relative z-10 flex gap-x-4 whitespace-nowrap px-4 sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                  {features.map((feature, featureIndex) => (
                    <div
                      key={feature.title}
                      className={clsx(
                        "group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6",
                        selectedIndex === featureIndex
                          ? "bg-white lg:bg-white/10 lg:ring-1 lg:ring-inset lg:ring-white/10"
                          : "hover:bg-white/10 lg:hover:bg-white/5",
                      )}
                    >
                      <h3>
                        <Tab
                          className={clsx(
                            "font-display text-lg ui-not-focus-visible:outline-none",
                            selectedIndex === featureIndex
                              ? "text-primary lg:text-white"
                              : "text-white hover:text-white lg:text-white",
                          )}
                        >
                          <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                          {feature.title}
                        </Tab>
                      </h3>
                      <p
                        className={clsx(
                          "mt-2 hidden text-sm lg:block",
                          selectedIndex === featureIndex
                            ? "text-white"
                            : "text-white group-hover:text-white",
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </Tab.List>
              </div>
              <Tab.Panels className="lg:col-span-7">
                {features.map((feature) => (
                  <Tab.Panel key={feature.title} unmount={false}>
                    <div className="relative sm:px-6 lg:hidden">
                      <div className="absolute -inset-x-4 bottom-[-4.25rem] top-[-6.5rem] bg-white/10 ring-1 ring-inset ring-white/10 sm:inset-x-0 sm:rounded-t-xl" />
                      <p className="relative mx-auto max-w-2xl text-base text-white sm:text-center">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-10 w-[45rem] overflow-hidden rounded-xl bg-slate-50 shadow-xl sm:w-auto lg:mt-0 lg:w-[67.8125rem]">
                      <img
                        className="w-full"
                        src={feature.image}
                        alt=""
                        sizes="(min-width: 1024px) 67.8125rem, (min-width: 640px) 100vw, 45rem"
                      />
                    </div>
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </>
          )}
        </Tab.Group>
      </div>
    </section>
  );
}
