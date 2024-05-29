import { MarketingLink } from "./marketing-link";

export default function MarketingLinks({ routes }) {
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
