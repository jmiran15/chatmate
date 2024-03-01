import { cssBundleHref } from "@remix-run/css-bundle";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import * as gtag from "~/utils/gtags.client";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

import stylesheet from "~/tailwind.css";
import markdownStyle from "./styles/lib/markdown.css";
import highlightStyle from "./styles/lib/highlight.css";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { getUser } from "./session.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: markdownStyle },
  { rel: "stylesheet", href: highlightStyle },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

// Load the GA tracking id from the .env
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    user: await getUser(request),
    gaTrackingId: process.env.GA_TRACKING_ID,
  });
};

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "Chatmate",
    viewport: "width=device-width,initial-scale=1",
  },
];

export default function App() {
  const location = useLocation();
  const { gaTrackingId } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (gaTrackingId?.length) {
      gtag.pageview(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "l2cwgd2upk");`,
          }}
        ></script>
      </head>

      <body className="h-full bg-transparent">
        {process.env.NODE_ENV === "development" || !gaTrackingId ? null : (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
            />
            <script
              async
              id="gtag-init"
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${gaTrackingId}', {
                  page_path: window.location.pathname,
                });
              `,
              }}
            />
          </>
        )}
        <Theme>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <Toaster />
        </Theme>
      </body>
    </html>
  );
}
