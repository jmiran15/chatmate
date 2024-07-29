import { MarketingLink } from "./marketing-link";
import { Container } from "../../components/landing/container";
import { useLinks } from "./use-links";

export function Footer() {
  const { routes } = useLinks();

  return (
    <footer className="hidden lg:block bg-muted/40">
      <Container>
        <nav className="hidden lg:flex items-center justify-center">
          {routes.map((route, index) => (
            <MarketingLink key={index} path={route.path}>
              {route.title}
            </MarketingLink>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
