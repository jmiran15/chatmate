import { SEOHandle } from "@nasa-gcn/remix-seo";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  ClientLoaderFunctionArgs,
  Outlet,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  Gift,
  Heart,
  Loader2,
  MessageCircle,
  Star,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "~/components/ui/button";
import { prisma } from "~/db.server";
import { createCustomer, stripe } from "~/models/subscription.server";
import { Header } from "~/routes/_header._index/header";
import { requireUser, requireUserId } from "~/session.server";
import { fbStartTrial } from "~/utils/fbq.client";
import { getPricing } from "~/utils/pricing.server";
import { useRafState } from "./useRafState";

// should probably add loader for auth check here?
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const pricing = getPricing();

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // TODO - return the chatbots count
  const chatbots = await prisma.chatbot.count({ where: { userId } });

  return json({
    userId,
    priceId: subscription?.priceId,
    features: pricing.pricing.find(
      (plan) => plan.planId === subscription?.planId,
    )?.features,
    hasSubscription: !!subscription,
    status: subscription?.status,
    chatbotsCount: chatbots,
    pricing: pricing,
  });
};

export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const serverData = await serverLoader<typeof loader>();

  if (!serverData.hasSubscription) {
    // TODO - if they have no subscription, create a free trial subscription with the priceId  ( or unlimited if no priceId)

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

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser(request);
  if (!user.customerId) {
    const updatedUser = await createCustomer({ userId: user.id });
    if (!updatedUser.customerId) throw new Error(`User not found.`);
  }
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "createTrial") {
    const priceId = String(formData.get("priceId"));
    const successUrl = String(formData.get("successUrl"));

    // TODO - wherever we create customer for the first time, check if they have a subscription, if not, create a FREE TRIAL (with the selected plan, or unlimited if no selection) subscription for them
    // TODO - maybe we need to do this in the useEffect where we create the subscription checkout (since that's where we have the priceId)
    const subscription = await stripe.subscriptions.create({
      customer: user.customerId!,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: 7,
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      trial_settings: {
        end_behavior: {
          missing_payment_method: "pause",
        },
      },
    });

    try {
      const dbSubscription = await prisma.subscription.create({
        data: {
          id: subscription.id,
          userId: user.id,
          planId: String(subscription.items.data[0].plan.product),
          priceId: String(subscription.items.data[0].price.id),
          interval: String(subscription.items.data[0].plan.interval),
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
        },
      });

      console.log(
        "dbSubscription created for new Google user: ",
        dbSubscription,
      );
      return redirect(successUrl);
    } catch (err: unknown) {
      console.log(err);
      return json({ error: err }, { status: 500 });
    }
  }
};

// Custom Spinner component
function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export default function ChatbotsLayout() {
  const {
    hasSubscription,
    priceId,
    userId,
    features,
    status,
    chatbotsCount,
    pricing,
  } = useLoaderData<typeof loader>();

  console.log("features: ", features);
  const checkoutFetcher = useFetcher({ key: "checkoutGoogle" });
  const { width, height } = useWindowSize();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTrialCelebration, setShowTrialCelebration] = useState(false);
  const navigate = useNavigate();
  const trialEndDate = DateTime.now()
    .plus({ days: 7 })
    .toLocaleString(DateTime.DATE_FULL);

  const success = searchParams.get("success");
  const trialInitialized = searchParams.get("trialInitialized");
  const confettiRef = useRef(null);

  console.log({ hasSubscription, priceId, userId });

  // TODO - we are getting rid of trials ... so this will need to change somehow
  useEffect(() => {
    if (!hasSubscription && priceId) {
      // CREATE THEIR INITIAL FREE TRIAL HERE WITH UNLIMITED PRICEID OR THE ONE THAT IS IN LOCAL STORAGE

      checkoutFetcher.submit(
        {
          intent: "createTrial",
          priceId,
          successUrl: "/chatbots?trialInitialized=true",
        },
        { method: "POST", action: "/chatbots" },
      );
      localStorage.removeItem("priceId"); // We only redirect them to the checkout page the initial time after they auth with Google. After that they just won't be able to make a chatbot, and will see the upgrade button
    }
  }, [hasSubscription, priceId]);

  useEffect(() => {
    // TODO - if they come in, and their subscription is paused, we need to redirect them to the billing page
    // if they have a pause subscription, redirect them to the billing page
    // calculate the priceId based on their usage (number of chatbots)
    // THIS IN HERE IS ESSENTIALLY THE SAME STUFF WE DO IN THE WEBHOOK FOR WHEN THEIR TRIAL ENDS AND WE SEND THEM THE EMAIL WITH CHECKOUT LINK

    const statusCodesThatRequireBilling = [
      "paused",
      "incomplete",
      "incomplete_expired",
      "past_due",
      "canceled",
      "unpaid",
    ];
    if (status && statusCodesThatRequireBilling.includes(status)) {
      const { isDev, devPriceIds, prodPriceIds } = pricing;
      const priceIds = isDev ? devPriceIds : prodPriceIds;
      const priceId =
        chatbotsCount === 1
          ? priceIds.hobby.month
          : chatbotsCount <= 5
          ? priceIds.standard.month
          : priceIds.unlimited.month;

      checkoutFetcher.submit(
        {
          intent: "createCheckout",
          priceId,
          successUrl: "/chatbots?success=true",
          cancelUrl: "/",
        },
        { method: "POST", action: "/chatbots/settings/billing" },
      );
    }
  }, [status, chatbotsCount, pricing]);

  useEffect(() => {
    if (hasSubscription) {
      localStorage.removeItem("priceId");
    }
  }, [hasSubscription]);

  const drawStar = (ctx: CanvasRenderingContext2D) => {
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
    } else if (trialInitialized === "true") {
      startTrialCelebration();
      fbStartTrial(19, 50);
    }
  }, [success, trialInitialized, setSearchParams]);

  const handleCloseToast = () => {
    setShowCelebration(false);
  };

  const startTrialCelebration = () => {
    setShowTrialCelebration(true);
    // Remove 'success' from search params
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("trialInitialized");
        return newParams;
      },
      { replace: true },
    );
    setTimeout(() => {
      setShowTrialCelebration(false);
    }, 10000);
  };

  const handleCloseTrialToast = () => {
    setShowTrialCelebration(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <AnimatePresence>
        {showCelebration && (
          <>
            <div className="fixed inset-0 z-[998]">
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
            </div>
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
        {showTrialCelebration && (
          <>
            <div className="fixed inset-0 z-[998]">
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
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="fixed inset-0 flex items-center justify-center z-[999] p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTrialToast}
                  className="absolute top-2 right-2 h-8 w-8"
                  aria-label="Close trial celebration"
                >
                  <X className="h-4 w-4" />
                </Button>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-6"
                >
                  <h2 className="text-2xl font-bold text-purple-600 mb-4">
                    Welcome to Your Free Trial!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your 7-day adventure starts now. Let's make the most of it!
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Your trial will end on{" "}
                    <span className="font-semibold">{trialEndDate}</span>.
                  </p>
                  <motion.div className="space-y-4 mb-6">
                    {features &&
                      features.slice(0, 3).map((feature, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center space-x-2 text-sm"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          {index === 0 && (
                            <Star className="w-5 h-5 text-yellow-500" />
                          )}
                          {index === 1 && (
                            <MessageCircle className="w-5 h-5 text-red-500" />
                          )}
                          {index === 2 && (
                            <Database className="w-5 h-5 text-green-500" />
                          )}
                          <span>{feature}</span>
                        </motion.div>
                      ))}
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        setShowTrialCelebration(false);
                        navigate("/chatbots/new");
                      }}
                    >
                      <motion.span
                        initial={{ opacity: 1 }}
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center justify-center"
                      >
                        Create Your First Chatbot
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.span>
                    </Button>
                  </motion.div>
                  <p className="text-sm text-gray-500 text-center mt-4">
                    Need help? Contact us at{" "}
                    <a
                      href="mailto:jonathan@chatmate.so"
                      className="text-primary"
                    >
                      jonathan@chatmate.so
                    </a>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Header />
      <div className="flex-1 overflow-hidden">
        <Outlet />
        {checkoutFetcher.state === "submitting" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
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
