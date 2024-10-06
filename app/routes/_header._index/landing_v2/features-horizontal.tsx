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
        "mt-px  focus-within:relative focus-within:z-10",
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
    <Accordion.Header className="">
      <Accordion.Trigger
        className={cn("", className)}
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
        "data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down",
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

type CardDataProps = {
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
  data: CardDataProps[];
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
    <section id="features">
      <div className="container">
        <div className="max-w-6xl mx-auto ">
          <div className="">
            <div
              className={`hidden md:flex order-1 md:order-[0]  ${
                ltr ? "md:order-2 md:justify-end" : "justify-start"
              }`}
            >
              <Accordion.Root
                className="grid md:grid-cols-4 gap-x-10 py-8"
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
                    className="relative mb-8"
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

                    <AccordionTrigger>
                      <div className="flex items-center relative flex-col">
                        <div className="item-box size-16 bg-orange-500/10 rounded-full sm:mx-6 mx-2 shrink-0 flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="font-bold text-xl my-3 ">
                          {item.title}
                        </div>
                        <div className="justify-center text-center mb-4">
                          {item.content}
                        </div>
                      </div>
                    </AccordionTrigger>
                  </AccordionItem>
                ))}
              </Accordion.Root>
            </div>
            <div
              className={`w-auto overflow-hidden relative rounded-lg ${
                ltr && "md:order-1"
              }`}
            >
              {data[currentIndex]?.image ? (
                <motion.img
                  key={`img-${currentIndex}`}
                  src={data[currentIndex].image}
                  alt="feature"
                  className="aspect-auto h-full w-full object-cover relative border rounded-lg shadow-lg"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              ) : data[currentIndex]?.video ? (
                <motion.div
                  key={`video-${currentIndex}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <video
                    preload="auto"
                    src={data[currentIndex].video}
                    className="aspect-auto h-full w-full rounded-lg object-cover border shadow-lg"
                    autoPlay
                    loop
                    muted
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`placeholder-${currentIndex}`}
                  className="aspect-auto h-full w-full rounded-xl border border-neutral-300/50 bg-gray-200 p-1 min-h-[600px]"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                ></motion.div>
              )}
              {/* <BorderBeam
                size={400}
                duration={12}
                delay={9}
                borderWidth={1.5}
                colorFrom="hsl(var(--primary))"
                colorTo="hsl(var(--primary)/0)"
              /> */}
            </div>

            <ul
              ref={carouselRef}
              className="flex h-full snap-x flex-nowrap overflow-x-auto py-10 [-ms-overflow-style:none] [-webkit-mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [mask-image:linear-gradient(90deg,transparent,black_20%,white_80%,transparent)] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden snap-mandatory"
              style={{
                padding: "50px calc(50%)",
              }}
            >
              {data.map((item, index) => (
                <div
                  key={item.id}
                  className="card relative mr-8 grid h-full max-w-60 shrink-0 items-start justify-center py-4 last:mr-0"
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    scrollSnapAlign: "center",
                  }}
                >
                  <div className="absolute bottom-0 left-0 right-auto top-0 h-0.5 w-full overflow-hidden rounded-lg bg-neutral-300/50 dark:bg-neutral-300/30">
                    {currentIndex === index && (
                      <div className="absolute left-0 top-0 h-full w-full origin-top bg-orange-500"></div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{item.title}</h2>
                  <p className="mx-0 max-w-sm text-balance text-sm">
                    {item.content}
                  </p>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
