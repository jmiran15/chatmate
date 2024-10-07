import { SEOHandle } from "@nasa-gcn/remix-seo";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  Outlet,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Heart, Loader2, Star, X } from "lucide-react"; // Import Loader2 icon from Lucide
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";

import { prisma } from "~/db.server";
import { Header } from "~/routes/_header._index/header";
import { requireUserId } from "~/session.server";
import { getPricing } from "~/utils/pricing.server";
import { useRafState } from "./useRafState";
// import { pricing } from "../_header._index/landing_v2/pricing";

// should probably add loader for auth check here?
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const pricing = getPricing();
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  console.log("pricing: ", pricing);
  console.log("subscription: ", subscription);

  return json({
    userId,
    priceId: subscription?.priceId,
    features: pricing.pricing.find(
      (plan) => plan.planId === subscription?.planId,
    )?.features,
    hasSubscription: !!subscription,
  });
};

export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const serverData = await serverLoader<typeof loader>();

  if (!serverData.hasSubscription) {
    try {
      const priceId = localStorage.getItem("priceId");
      if (priceId) {
        return {
          hasSubscription: serverData.hasSubscription,
          userId: serverData.userId,
          priceId,
        };
      }
      return {
        hasSubscription: serverData.hasSubscription,
        userId: serverData.userId,
        priceId: null,
      };
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }
  return serverData;
};
clientLoader.hydrate = true;

// Custom Spinner component
function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export default function ChatbotsLayout() {
  const { hasSubscription, priceId, userId, features } =
    useLoaderData<typeof loader>();

  console.log("features: ", features);
  const checkoutFetcher = useFetcher({ key: "checkoutGoogle" });
  const { width, height } = useWindowSize();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCelebration, setShowCelebration] = useState(false);

  const success = searchParams.get("success");
  const confettiRef = useRef(null);

  console.log({ hasSubscription, priceId, userId });

  useEffect(() => {
    if (!hasSubscription && priceId) {
      checkoutFetcher.submit(
        {
          intent: "createCheckout",
          priceId,
          successUrl: "/chatbots?success=true",
          cancelUrl: "/",
        },
        { method: "POST", action: "/chatbots/settings/billing" },
      );
      localStorage.removeItem("priceId"); // We only redirect them to the checkout page the initial time after they auth with Google. After that they just won't be able to make a chatbot, and will see the upgrade button
    }
  }, [hasSubscription, priceId]);

  useEffect(() => {
    if (hasSubscription) {
      localStorage.removeItem("priceId");
    }
  }, [hasSubscription]);

  const drawStar = (ctx) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        Math.cos(((18 + i * 72) / 180) * Math.PI) * 5,
        -Math.sin(((18 + i * 72) / 180) * Math.PI) * 5,
      );
      ctx.lineTo(
        Math.cos(((54 + i * 72) / 180) * Math.PI) * 2.5,
        -Math.sin(((54 + i * 72) / 180) * Math.PI) * 2.5,
      );
    }
    ctx.closePath();
    ctx.fill();
  };

  const startCelebration = () => {
    console.log("Starting celebration"); // Debug log
    setShowCelebration(true);
    // Remove 'success' from search params
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("success");
        return newParams;
      },
      { replace: true },
    );
    setTimeout(() => {
      console.log("Ending celebration"); // Debug log
      setShowCelebration(false);
    }, 7000);
  };

  useEffect(() => {
    if (success === "true") {
      startCelebration();
    }
  }, [success, setSearchParams]);

  const handleCloseToast = () => {
    setShowCelebration(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <AnimatePresence>
        {showCelebration && (
          <>
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.15}
              wind={0.05}
              colors={[
                "#FFD700",
                "#FFA500",
                "#FF4500",
                "#8A2BE2",
                "#4B0082",
                "#00CED1",
                "#FF1493",
              ]}
              drawShape={drawStar}
              ref={confettiRef}
            />
            {features && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.5 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="fixed top-4 right-4 bg-white text-gray-800 p-6 rounded-lg shadow-xl z-[999] max-w-sm overflow-hidden"
              >
                <button
                  onClick={handleCloseToast}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  aria-label="Close celebration message"
                >
                  <X size={20} />
                </button>
                <div className="relative">
                  <h2 className="text-2xl font-bold mb-3 text-purple-600">
                    You're Amazing!
                  </h2>
                  <p className="text-base mb-4">
                    Thank you for joining our premium family. Get ready for an
                    incredible journey!
                  </p>
                  <div className="space-y-3">
                    <motion.div
                      className="flex items-center"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Star className="w-6 h-6 text-yellow-500 mr-3" />
                      <span className="text-sm">{features[0]}</span>
                    </motion.div>
                    <motion.div
                      className="flex items-center"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Heart className="w-6 h-6 text-red-500 mr-3" />
                      <span className="text-sm">{features[1]}</span>
                    </motion.div>
                    <motion.div
                      className="flex items-center"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Gift className="w-6 h-6 text-green-500 mr-3" />
                      <span className="text-sm">{features[2]}</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
      <Header />
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
        {checkoutFetcher.state === "submitting" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
              <Spinner className="w-12 h-12 text-primary" />
              <p className="text-lg font-semibold text-gray-800">
                Setting up your subscription...
              </p>
              <p className="text-sm text-gray-600 text-center">
                We're preparing your checkout. This may take a few moments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};

const useWindowSize = (initialWidth = Infinity, initialHeight = Infinity) => {
  const [state, setState] = useRafState<{ width: number; height: number }>({
    width: isBrowser ? window.innerWidth : initialWidth,
    height: isBrowser ? window.innerHeight : initialHeight,
  });

  useEffect((): (() => void) | void => {
    if (isBrowser) {
      const handler = () => {
        setState({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      on(window, "resize", handler);

      return () => {
        off(window, "resize", handler);
      };
    }
  }, []);

  return state;
};

export const noop = () => {};

export function on<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args: Parameters<T["addEventListener"]> | [string, Function | null, ...any]
): void {
  if (obj && obj.addEventListener) {
    obj.addEventListener(
      ...(args as Parameters<HTMLElement["addEventListener"]>),
    );
  }
}

export function off<T extends Window | Document | HTMLElement | EventTarget>(
  obj: T | null,
  ...args:
    | Parameters<T["removeEventListener"]>
    | [string, Function | null, ...any]
): void {
  if (obj && obj.removeEventListener) {
    obj.removeEventListener(
      ...(args as Parameters<HTMLElement["removeEventListener"]>),
    );
  }
}

export const isBrowser = typeof window !== "undefined";

export const isNavigator = typeof navigator !== "undefined";
