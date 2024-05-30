import { MarketingLink } from "./marketing-link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MarketingLinks({ routes }: { routes: any[] }) {
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
