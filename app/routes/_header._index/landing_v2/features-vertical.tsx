import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import React, { forwardRef, ReactNode, useRef, useState } from "react";

import { cn } from "~/lib/utils";

type AccordionItemProps = {
  children: React.ReactNode;
  className?: string;
} & Accordion.AccordionItemProps;

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Item
      className={cn(
        "mt-px overflow-hidden focus-within:relative focus-within:z-10",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      {children}
    </Accordion.Item>
  ),
);
AccordionItem.displayName = "AccordionItem";

type AccordionTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Header className="flex">
      <Accordion.Trigger
        className={cn(
          "group flex flex-1 cursor-pointer items-center justify-between px-5 text-[15px] leading-none outline-none",
          className,
        )}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </Accordion.Trigger>
    </Accordion.Header>
  ),
);
AccordionTrigger.displayName = "AccordionTrigger";
type AccordionContentProps = {
  children: ReactNode;
  className?: string;
} & Accordion.AccordionContentProps;

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <Accordion.Content
      className={cn(
        "overflow-hidden text-[15px] font-medium data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down",
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <div className="px-5 py-2">{children}</div>
    </Accordion.Content>
  ),
);
AccordionContent.displayName = "AccordionContent";

export type FeaturesDataProps = {
  id: number;
  title: string;
  content: string;
  image?: string;
  video?: string;
  icon?: React.ReactNode;
};

export type FeaturesProps = {
  ltr?: boolean;
  linePosition?: "left" | "right" | "top" | "bottom";
  data: FeaturesDataProps[];
};

export default function Features({
  ltr = false,
  linePosition = "left",
  data = [],
}: FeaturesProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const carouselRef = useRef<HTMLUListElement>(null);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const card = carouselRef.current.querySelectorAll(".card")[index];
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carouselRef.current.getBoundingClientRect();
        const offset =
          cardRect.left -
          carouselRect.left -
          (carouselRect.width - cardRect.width) / 2;

        carouselRef.current.scrollTo({
          left: carouselRef.current.scrollLeft + offset,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <section id="features" className="lg:py-20">
      <div className="container px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div
              className={`hidden lg:flex order-1 lg:order-[0] ${
                ltr ? "lg:order-2 lg:justify-end" : "justify-start"
              }`}
            >
              <Accordion.Root
                className="w-full"
                type="single"
                value={`item-${currentIndex}`}
                onValueChange={(value) => {
                  const index = Number(value.split("-")[1]);
                  setCurrentIndex(index);
                  scrollToIndex(index);
                }}
              >
                {data.map((item, index) => (
                  <AccordionItem
                    key={item.id}
                    className="relative mb-8 last:mb-0"
                    value={`item-${index}`}
                  >
                    {linePosition === "left" || linePosition === "right" ? (
                      <div
                        className={`absolute bottom-0 top-0 h-full w-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30 ${
                          linePosition === "right"
                            ? "left-auto right-0"
                            : "left-0 right-auto"
                        }`}
                      >
                        {currentIndex === index && (
                          <div className="absolute left-0 top-0 w-full h-full origin-top bg-orange-500 dark:bg-white"></div>
                        )}
                      </div>
                    ) : null}

                    {linePosition === "top" || linePosition === "bottom" ? (
                      <div
                        className={`absolute left-0 right-0 w-full h-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30 ${
                          linePosition === "bottom" ? "bottom-0" : "top-0"
                        }`}
                      >
                        {currentIndex === index && (
                          <div
                            className={`absolute left-0 ${
                              linePosition === "bottom" ? "bottom-0" : "top-0"
                            } h-full w-full origin-left bg-orange-500 dark:bg-white`}
                          ></div>
                        )}
                      </div>
                    ) : null}

                    <div className="flex items-center relative">
                      <div className="item-box w-12 h-12 bg-orange-500/10 rounded-full sm:mx-6 mx-2 shrink-0 flex items-center justify-center">
                        {item.icon}
                      </div>

                      <div>
                        <AccordionTrigger className="text-xl font-bold pl-0">
                          {item.title}
                        </AccordionTrigger>

                        <AccordionTrigger className="justify-start text-left leading-4 text-[16px] pl-0">
                          {item.content}
                        </AccordionTrigger>
                      </div>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion.Root>
            </div>
            <div
              className={`w-full h-auto aspect-video ${ltr && "lg:order-1"}`}
            >
              {data[currentIndex]?.image ? (
                <motion.img
                  key={`img-${currentIndex}`}
                  src={data[currentIndex].image}
                  alt="feature"
                  className="w-full h-full object-contain lg:object-cover lg:object-left-top rounded-xl border border-neutral-300/50 p-1 shadow-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              ) : data[currentIndex]?.video ? (
                <motion.div
                  key={`video-${currentIndex}`}
                  className="w-full"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <video
                    preload="auto"
                    src={data[currentIndex].video}
                    className="w-full rounded-lg shadow-xl object-contain"
                    autoPlay
                    loop
                    muted
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`placeholder-${currentIndex}`}
                  className="w-full h-full rounded-xl border border-neutral-300/50 bg-gray-200 p-1"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                ></motion.div>
              )}
            </div>

            <ul
              ref={carouselRef}
              className="flex lg:hidden snap-x overflow-x-auto py-6 [-ms-overflow-style:none] [-webkit-mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-mandatory"
              style={{
                padding: "24px calc(50% - 120px)",
              }}
            >
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className="card relative mr-6 w-60 shrink-0 py-4"
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    scrollSnapAlign: "center",
                  }}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30">
                    {currentIndex === index && (
                      <div className="absolute left-0 top-0 h-full w-full origin-top bg-orange-500"></div>
                    )}
                  </div>
                  <h2 className="text-lg font-bold mb-2">{item.title}</h2>
                  <p className="text-sm">{item.content}</p>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
