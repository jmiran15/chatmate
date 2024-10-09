import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import posthog from "posthog-js";
import { useEffect } from "react";
import stylesheet from "~/tailwind.css?url";
import * as gtag from "~/utils/gtags.client";
import { generateCanonicalUrl, generateMetaTags } from "~/utils/seo";
import { Toaster } from "./components/ui/toaster";
import { getUser } from "./session.server";
import highlightStyle from "./styles/lib/highlight.css?url";
import markdownStyle from "./styles/lib/markdown.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: markdownStyle },
  { rel: "stylesheet", href: highlightStyle },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    user: await getUser(request),
    gaTrackingId: process.env.GA_TRACKING_ID,
  });
};

export const meta: MetaFunction = ({ location }) => {
  const canonicalUrl = generateCanonicalUrl(location.pathname);
  return [
    ...generateMetaTags({
      title: "Chatmate - AI Chat Bot for Your Website",
      description:
        "Solve 80% of your customers' support inflow instantly on web using our AI customer support platform",
      url: canonicalUrl,
      type: "website",
    }),
  ];
};

export default function App() {
  const location = useLocation();
  const { gaTrackingId } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (gaTrackingId?.length) {
      gtag.pageview(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  useEffect(() => {
    posthog.capture("$pageview");
  }, [location]);

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="canonical" href={generateCanonicalUrl(location.pathname)} />
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
        />
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
          <Toaster />
          <div id="modal-container" />
        </Theme>
        {/* widget */}
        <script
          type="module"
          data-chatmate-widget-script="true"
          data-embed-id="f4fce919-86f4-481f-93b7-1b4dd58dee2a"
          src="https://chatmate-widget.vercel.app/chatmate-chat-widget.js"
          async
        ></script>
      </body>
    </html>
  );
}
