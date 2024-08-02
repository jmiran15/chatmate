import { generateRobotsTxt } from "@nasa-gcn/remix-seo";
import { siteMetadata } from "~/utils/siteMetadata";

const siteUrl =
  process.env.NODE_ENV === "production"
    ? siteMetadata.siteUrl
    : "http://localhost:3000";

export function loader() {
  return generateRobotsTxt([
    { type: "sitemap", value: `${siteUrl}/sitemap.xml` },
    { type: "disallow", value: "/admin" },
  ]);
}
