import {
  motion,
  useTransform,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
} from "framer-motion";
import screenshotChats from "../../images/screenshots/chats.png";
import { Link } from "@remix-run/react";
import { buttonVariants } from "../ui/button";
import { useOptionalUser } from "~/utils";
import H3 from "./h3";
import { Container } from "./container";
import { cn } from "~/lib/utils";
import { useEffect, useRef, useState } from "react";

export function Hero() {
  const user = useOptionalUser();
  const { scrollY } = useScroll();
  const ref = useRef<HTMLImageElement>(null);
  const [initialDistanceFromCenter, setInitialDistanceFromCenter] = useState(0);
  const distance = useMotionValue(0);

  useEffect(() => {
    const handleResize = () => {
      if (ref.current && typeof window !== "undefined") {
        const el = ref.current.getBoundingClientRect();
        const imgCenter = el.bottom - el.height / 2;
        const distanceFromCenter = imgCenter - window.innerHeight / 2;
        distance.set(distanceFromCenter);
      }
    };

    handleResize();
    if (ref.current && typeof window !== "undefined") {
      const el = ref.current.getBoundingClientRect();
      const imgCenter = el.bottom - el.height / 2;
      const distanceFromCenter = imgCenter - window.innerHeight / 2;
      setInitialDistanceFromCenter(distanceFromCenter);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const rotateX = useTransform(
    distance,
    [initialDistanceFromCenter, 0],
    [20, 0],
  );

  useMotionValueEvent(scrollY, "change", () => {
    if (ref.current && typeof window !== "undefined") {
      const el = ref.current.getBoundingClientRect();
      const imgCenter = el.bottom - el.height / 2;
      const distanceFromCenter = imgCenter - window.innerHeight / 2;
      distance.set(distanceFromCenter);
    }
  });

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Container>
      <div
        className="flex flex-col gap-16 items-center"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div className="flex flex-col gap-8 items-center">
          <H1 />
          <H3 className="text-muted-foreground">
            Create custom AI chatbots that provide fast and accurate responses,
            resolving customer inquiries and instantly reducing your team’s
            ticket volume
          </H3>
          <div className="flex flex-col gap-1 items-center w-full">
            <Link
              className={cn(
                buttonVariants({ variant: "default" }),
                "relative text-white p-7 text-xl font-semibold shadow-lg",
                "transition duration-300 ease-in-out",
                "hover:scale-105 hover:shadow-inner hover:shadow-white/30",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50",
              )}
              to={user ? "/chatbots" : "/join"}
            >
              <span className="relative z-10">
                {user ? "My chatbots" : "Start for free"}
              </span>
            </Link>
            {!user ? (
              <p className="text-sm text-muted-foreground">
                No credit card required.
              </p>
            ) : null}
          </div>
        </div>
        <motion.img
          ref={ref}
          className="w-full hidden md:block rounded-xl border"
          src={screenshotChats}
          alt=""
          style={{ rotateX }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 100,
            damping: 30,
          }}
        />
      </div>
    </Container>
  );
}

function H1() {
  return (
    <h1 className="mx-auto max-w-4xl font-display text-4xl font-medium tracking-tight text-slate-900 md:text-7xl text-balance text-center">
      AI Chatbot to{" "}
      <span className="relative whitespace-nowrap text-orange-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 418 42"
          className="absolute left-0 top-2/3 h-[0.58em] w-full fill-orange-300/70"
          preserveAspectRatio="none"
        >
          <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
        </svg>
        <span className="relative">Instantly Resolve</span>
      </span>{" "}
      80% of your support queries.
    </h1>
  );
}
