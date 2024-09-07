// TODO - use this to generate initial sitemap, get rid of double slashes (i.e. any errors) and return in loader ... until @nasa-gcn/remix-seo is fixed
// import { generateSitemap } from "@nasa-gcn/remix-seo";
// import { type LoaderFunctionArgs, type ServerBuild } from "@remix-run/node";

// function getDomainUrl(request: Request) {
//   const host =
//     request.headers.get("X-Forwarded-Host") ??
//     request.headers.get("host") ??
//     new URL(request.url).host;
//   const protocol = request.headers.get("X-Forwarded-Proto") ?? "http";
//   return `${protocol}://${host}`;
// }

// export async function loader({ request, context }: LoaderFunctionArgs) {
//   const serverBuild = (await context.serverBuild) as ServerBuild;

//   return generateSitemap(request, serverBuild.routes, {
//     siteUrl: getDomainUrl(request),
//     headers: {
//       "Cache-Control": `public, max-age=${60 * 5}`,
//     },
//   });
// }

import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async ({ request }) => {
  const domain =
    process.env.NODE_ENV === "production"
      ? "https://chatmate.so"
      : "http://localhost:3000";

  const currentDate = new Date().toISOString().split("T")[0];

  // Generate your sitemap content here
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${domain}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>${domain}/blog/intercom-alternatives</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>${domain}/blog/front-alternatives</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>
    <url>
    <loc>${domain}/blog/tidio-alternatives</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>
</urlset>`;

  // Return the sitemap with the correct headers
  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "xml-version": "1.0",
      encoding: "UTF-8",
      "Cache-Control": `public, max-age=${60 * 60}`,
    },
  });
};
