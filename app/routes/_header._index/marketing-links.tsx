import { MarketingLink } from "./marketing-link";
import { useLinks } from "./use-links";

export default function MarketingLinks() {
  const { routes } = useLinks();
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
