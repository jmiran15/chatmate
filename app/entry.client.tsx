import { RemixBrowser } from "@remix-run/react";
import posthog from "posthog-js";
import { startTransition, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

function PosthogInit() {
  useEffect(() => {
    posthog.init("phc_3Wvjn94iZwzxTVuY3jcbwGFQZgHe0uuYhoiIYZiNV1K", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
    });
  }, []);

  return null;
}

startTransition(() => {
  hydrateRoot(
    document,
    <>
      <RemixBrowser />
      <PosthogInit />
    </>,
  );
});
