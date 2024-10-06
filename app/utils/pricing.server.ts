export function getPricing() {
  const isDev = process.env.NODE_ENV === "development";

  const devPlanIds = {
    hobby: "prod_Qx2m9UluIRTRRL",
    standard: "prod_Qx2mIRb2RYweno",
    unlimited: "prod_Qx2nOvv0JgNpOa",
  };

  const prodPlanIds = {
    hobby: "prod_Qyzew23FyahVHQ",
    standard: "prod_QyzeMyQ04dmYoe",
    unlimited: "prod_QyzeRGmhmZd7gz",
  };

  const devPriceIds = {
    hobby: {
      month: "price_1Q58gaFSz9CUblnBlDIarRjt",
      year: "price_1Q58gaFSz9CUblnBslgqB2PG",
    },
    standard: {
      month: "price_1Q58hHFSz9CUblnBdbnkLfn6",
      year: "price_1Q58hHFSz9CUblnBXjudBDis",
    },
    unlimited: {
      month: "price_1Q58hwFSz9CUblnBuCdk4sRy",
      year: "price_1Q58hwFSz9CUblnBLNFh0kqn",
    },
  };

  const prodPriceIds = {
    hobby: {
      month: "price_1Q71fGFSz9CUblnBCYKATiqg",
      year: "price_1Q71fGFSz9CUblnBR2lec1Nr",
    },
    standard: {
      month: "price_1Q71fMFSz9CUblnBjj69nmWx",
      year: "price_1Q71fMFSz9CUblnBeURdJSm1",
    },
    unlimited: {
      month: "price_1Q71fRFSz9CUblnBe8ruccE1",
      year: "price_1Q71fRFSz9CUblnBzi469yGH",
    },
  };

  const pricing = [
    {
      planId: isDev ? devPlanIds.hobby : prodPlanIds.hobby,
      name: "Hobby",
      price: "$19",
      period: "month",
      yearlyPrice: "$190",
      features: [
        "1 chatbot",
        "Unlimited chats",
        "Unlimited training data",
        "Live chat support",
        "Advanced analytics",
        "Custom lead forms",
        "Custom flows",
        "Widget customization",
        "AI model customization",
      ],
      description: "Perfect for individuals and small projects",
      buttonText: "Start free trial",
      isPopular: false,
      monthlyPriceId: isDev
        ? devPriceIds.hobby.month
        : prodPriceIds.hobby.month,
      yearlyPriceId: isDev ? devPriceIds.hobby.year : prodPriceIds.hobby.year,
      chatbotsLimit: 1,
    },
    {
      planId: isDev ? devPlanIds.standard : prodPlanIds.standard,
      name: "Standard",
      price: "$39",
      period: "month",
      yearlyPrice: "$390",
      features: [
        "5 chatbots",
        "Unlimited chats",
        "Unlimited training data",
        "Live chat support",
        "Advanced analytics",
        "Custom lead forms",
        "Custom flows",
        "Widget customization",
        "AI model customization",
      ],
      description: "Ideal for growing businesses and teams",
      buttonText: "Start free trial",
      isPopular: true,
      monthlyPriceId: isDev
        ? devPriceIds.standard.month
        : prodPriceIds.standard.month,
      yearlyPriceId: isDev
        ? devPriceIds.standard.year
        : prodPriceIds.standard.year,
      chatbotsLimit: 5,
    },
    {
      planId: isDev ? devPlanIds.unlimited : prodPlanIds.unlimited,
      name: "Unlimited",
      price: "$79",
      period: "month",
      yearlyPrice: "$790",
      features: [
        "Unlimited chatbots",
        "Unlimited chats",
        "Unlimited training data",
        "Live chat support",
        "Advanced analytics",
        "Custom lead forms",
        "Custom flows",
        "Widget customization",
        "AI model customization",
      ],
      description: "For large-scale operations and high-volume users",
      buttonText: "Start free trial",
      isPopular: false,
      monthlyPriceId: isDev
        ? devPriceIds.unlimited.month
        : prodPriceIds.unlimited.month,
      yearlyPriceId: isDev
        ? devPriceIds.unlimited.year
        : prodPriceIds.unlimited.year,
      chatbotsLimit: Infinity,
    },
  ];

  return {
    isDev,
    pricing,
    devPlanIds,
    prodPlanIds,
    devPriceIds,
    prodPriceIds,
  };
}
