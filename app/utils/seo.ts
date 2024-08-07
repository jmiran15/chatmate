import type { MetaFunction } from "@remix-run/node";

interface SEOProps {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
  applicationName?: string;
}

export const generateMetaTags = ({
  title,
  description,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  keywords,
  applicationName,
}: SEOProps): ReturnType<MetaFunction> => {
  const metaTags = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "follow, index" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: applicationName || "Chatmate" },
    { property: "og:locale", content: "en_US" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@chatmate" },
    { name: "twitter:creator", content: author || "@chatmate" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (publishedTime) {
    metaTags.push({
      property: "article:published_time",
      content: publishedTime,
    });
  }

  if (modifiedTime) {
    metaTags.push({ property: "article:modified_time", content: modifiedTime });
  }

  if (keywords) {
    metaTags.push({ name: "keywords", content: keywords });
  }

  return metaTags;
};

export const generateCanonicalUrl = (path: string) => {
  return `https://chatmate.so${path}`;
};
