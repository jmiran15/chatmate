import { Link } from "@remix-run/react";
import { Icons } from "../../components/icons";
import { CompareColumn } from "./compare-column";
import { MarketingLink } from "./marketing-link";
import { useLinks } from "./use-links";

export function Footer() {
  const { routes } = useLinks();

  const PRIVACY_POLICY_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=064c1b30-2950-4e38-9908-700473644f6c";

  const TERMS_OF_SERVICE_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=6201437d-0e7b-4223-a7b8-72c15211f9ac";
  const REFUND_POLICY_URL =
    "https://app.termly.io/policy-viewer/policy.html?policyUUID=2dd2e155-c4f3-4ec7-a5d2-e33efafb6154";
  const CONTACT_US_URL = "mailto:jonathan@chatmate.so";
  return (
    <footer className="bg-muted/40 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between">
          {/* Left column */}
          <div className="mb-8 lg:mb-0 lg:max-w-xs">
            <Link to="/" className="flex items-center gap-2 font-semibold mb-4">
              <Icons.logo className="h-6 w-6" />
              <span className="text-xl">Chatmate</span>
            </Link>
            <p className=" text-muted-foreground">
              Chatmate helps you create intelligent chatbots to engage your
              customers.
            </p>
          </div>

          {/* Right columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
            {/* Product column */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <nav className="flex flex-col space-y-1 -ml-3">
                {routes.map((route, index) => (
                  <MarketingLink key={index} path={route.path}>
                    {route.title}
                  </MarketingLink>
                ))}
              </nav>
            </div>

            {/* Compare column */}
            <CompareColumn />

            {/* Company column */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <nav className="flex flex-col space-y-1 -ml-3">
                <MarketingLink path={TERMS_OF_SERVICE_URL} external>
                  Terms of Service
                </MarketingLink>
                <MarketingLink path={PRIVACY_POLICY_URL} external>
                  Privacy Policy
                </MarketingLink>
                <MarketingLink path={REFUND_POLICY_URL} external>
                  Refund Policy
                </MarketingLink>
                <MarketingLink path={CONTACT_US_URL}>Contact Us</MarketingLink>
              </nav>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-muted-foreground/20">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Chatmate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
