import { MarketingLink } from "./marketing-link";

interface ComparisonLink {
  path: string;
  title: string;
}

const comparisonLinks: ComparisonLink[] = [
  { path: "/blog/intercom-alternatives", title: "Intercom alternatives" },
  { path: "/blog/front-alternatives", title: "Front alternatives" },
  { path: "/blog/tidio-alternatives", title: "Tidio alternatives" },
];

export function CompareColumn() {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">Compare</h3>
      <nav className="flex flex-col space-y-1 -ml-3">
        {comparisonLinks.map((link, index) => (
          <MarketingLink key={index} path={link.path}>
            {link.title}
          </MarketingLink>
        ))}
      </nav>
    </div>
  );
}
