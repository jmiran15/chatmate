import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { type LoaderFunctionArgs } from "@remix-run/node";

function getDomainUrl(request: Request) {
  const host =
    request.headers.get("X-Forwarded-Host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  return `${protocol}://${host}`;
}

export function loader({ request }: LoaderFunctionArgs) {
  return generateRobotsTxt([
    { type: "sitemap", value: `${getDomainUrl(request)}/sitemap.xml` },
  ]);
}
