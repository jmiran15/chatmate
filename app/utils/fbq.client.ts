declare global {
  interface Window {
    fbq: (
      method: string,
      eventName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/**
 * Facebook Pixel pageview
 */
export const fbPageview = () => {
  if (!window.fbq) {
    console.warn(
      "window.fbq is not defined. This could mean your Facebook Pixel script has not loaded on the page yet.",
    );
    return;
  }
  window.fbq("track", "PageView");
};

/**
 * Facebook Pixel custom event
 */
export const fbEvent = (
  eventName: string,
  params?: Record<string, unknown>,
) => {
  if (!window.fbq) {
    console.warn(
      "window.fbq is not defined. This could mean your Facebook Pixel script has not loaded on the page yet.",
    );
    return;
  }
  window.fbq("track", eventName, params);
};

/**
 * Facebook Pixel StartTrial event
 */
export const fbStartTrial = (value: number = 19, predictedLtv: number = 50) => {
  if (!window.fbq) {
    console.warn(
      "window.fbq is not defined. This could mean your Facebook Pixel script has not loaded on the page yet.",
    );
    return;
  }
  window.fbq("track", "StartTrial", {
    value: value,
    currency: "USD",
    predicted_ltv: predictedLtv,
  });
};
