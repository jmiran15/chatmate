import { type ServerBuild, type LoaderFunctionArgs } from "@remix-run/node";
import { generateSitemap } from "@nasa-gcn/remix-seo";
import { siteMetadata } from "~/utils/siteMetadata";

const siteUrl =
  process.env.NODE_ENV === "production"
    ? siteMetadata.siteUrl
    : "http://localhost:3000";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const serverBuild = (await context.serverBuild) as ServerBuild;
  return generateSitemap(request, serverBuild.routes, {
    siteUrl,
    headers: {
      "Cache-Control": `public, max-age=${60 * 5}`,
    },
  });
}
