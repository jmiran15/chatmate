import { MarketingLink } from "../layout/marketing-link";
import { Container } from "./container";

export function Footer() {
  const marketingLinks = [
    {
      path: "#features",
      title: "Features",
    },

    {
      path: "#pricing",
      title: "Pricing",
    },

    {
      path: "#faq",
      title: "FAQ",
    },
  ];
  return (
    <footer className="hidden lg:block bg-muted/40">
      <Container>
        <nav className="hidden lg:flex items-center justify-center">
          {marketingLinks.map((route, index) => (
            <MarketingLink key={index} path={route.path}>
              {route.title}
            </MarketingLink>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
