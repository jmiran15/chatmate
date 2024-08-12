import type { MetaFunction } from "@remix-run/node";

interface SEOProps {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  keywords?: string;
}

export const generateMetaTags = ({
  title,
  description,
  url,
  image,
  type = "article",
  publishedTime,
  author,
  keywords,
}: SEOProps): ReturnType<MetaFunction> => {
  const metaTags = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "follow, index" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: "Chatmate" },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1400" },
    { property: "og:image:height", content: "1050" },
    { property: "og:image:type", content: "image/png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@chatmate_so" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  if (publishedTime) {
    metaTags.push({
      property: "article:published_time",
      content: publishedTime,
    });
  }

  if (author) {
    metaTags.push({ name: "author", content: author });
  }

  if (keywords) {
    metaTags.push({ name: "keywords", content: keywords });
  }

  return metaTags;
};

export const generateCanonicalUrl = (path: string) => {
  return `https://chatmate.so${path}`;
};
