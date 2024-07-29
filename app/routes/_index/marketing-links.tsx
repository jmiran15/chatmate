import { MarketingLink } from "./marketing-link";
import { RouteLink } from "./use-links";

export default function MarketingLinks({ routes }: { routes: RouteLink[] }) {
  return (
    <nav className="hidden lg:flex items-center justify-center">
      {routes.map((route, index) => (
        <MarketingLink key={index} path={route.path}>
          {route.title}
        </MarketingLink>
      ))}
    </nav>
  );
}
