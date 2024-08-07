import { generateSitemap } from "@nasa-gcn/remix-seo";
import { type ServerBuild, type LoaderFunctionArgs } from "@remix-run/node";

function getDomainUrl(request: Request) {
  const host =
    request.headers.get("X-Forwarded-Host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const serverBuild = (await context.serverBuild) as ServerBuild | undefined;

  console.log("context", context, serverBuild);

  if (!serverBuild || !serverBuild.routes) {
    throw new Error("Server build or routes not available");
  }

  return generateSitemap(request, serverBuild.routes, {
    siteUrl: getDomainUrl(request),
    headers: {
      "Cache-Control": `public, max-age=${60 * 5}`,
    },
  });
}
