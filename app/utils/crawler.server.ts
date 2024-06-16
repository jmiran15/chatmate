import axios from "axios";
import cheerio from "cheerio";
import { URL } from "url";
import async from "async";
import { getLinksFromSitemap } from "./sitemap.server";

interface Progress {
  current: number;
  total: number;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  currentDocumentUrl?: string;
}

export class WebCrawler {
  private initialUrl: string;
  private baseUrl: string; // Added to store the base URL
  private maxCrawledLinks: number;
  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  private visited: Set<string> = new Set();
  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  private crawledUrls: Set<string> = new Set();

  constructor({
    initialUrl,
    maxCrawledLinks = 100,
  }: {
    initialUrl: string;
    maxCrawledLinks?: number;
  }) {
    this.initialUrl = initialUrl;
    this.baseUrl = new URL(initialUrl).origin; // Initialize the base URL
    this.maxCrawledLinks = maxCrawledLinks;
  }

  public async start(
    inProgress?: (progress: Progress) => Promise<void>,
    concurrencyLimit = 5,
  ): Promise<string[]> {
    console.log("crawler - start");
    // Attempt to fetch and return sitemap links before any crawling
    // try {
    //   const sitemapLinks = await this.tryFetchSitemapLinks(this.initialUrl);
    //   console.log("crawler - sitemapLinks", sitemapLinks);
    //   if (sitemapLinks.length > 0) {
    //     return sitemapLinks;
    //   }
    // } catch (error) {
    //   console.error("crawler - error", error);
    // }
    console.log("crawler - here");
    // Proceed with crawling if no sitemap links found
    try {
      return await this.crawlUrls(
        [this.initialUrl],
        concurrencyLimit,
        inProgress,
      );
    } catch (error) {
      console.error("crawler - error", error);
      return [];
    }
  }

  private async crawlUrls(
    urls: string[],
    concurrencyLimit: number,
    inProgress?: (progress: Progress) => Promise<void>,
  ): Promise<string[]> {
    const queue = async.queue(async (task: string, callback) => {
      if (this.crawledUrls.size >= this.maxCrawledLinks) {
        if (callback && typeof callback === "function") {
          callback();
        }
        return;
      }
      const newUrls = await this.crawl(task);
      newUrls.forEach((url) => this.crawledUrls.add(url));

      if (inProgress && newUrls.length > 0) {
        await inProgress({
          current: this.crawledUrls.size,
          total: this.maxCrawledLinks,
          status: "SCRAPING",
          currentDocumentUrl: newUrls[newUrls.length - 1],
        });
      } else if (inProgress) {
        await inProgress({
          current: this.crawledUrls.size,
          total: this.maxCrawledLinks,
          status: "SCRAPING",
          currentDocumentUrl: task, // Fallback to the task URL if newUrls is empty
        });
      }
      await this.crawlUrls(newUrls, concurrencyLimit, inProgress);
      if (callback && typeof callback === "function") {
        callback();
      }
    }, concurrencyLimit);

    queue.push(
      urls.filter((url) => !this.visited.has(url)),
      (err) => {
        if (err) console.error(err);
      },
    );

    await queue.drain();
    return Array.from(this.crawledUrls);
  }

  async crawl(url: string): Promise<string[]> {
    // Check if URL is already visited
    if (this.visited.has(url)) return [];
    // Add to visited
    this.visited.add(url);
    // add https if the url does not have it
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    // remove backslash at the end of the url
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    // Early returns checks
    if (this.isFile(url) || this.isSocialMediaOrEmail(url)) {
      return [];
    }

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const links: string[] = [];
      const baseUrl = this.initialUrl.split("/").slice(0, 3).join("/");

      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href) {
          let fullUrl = href;
          if (!href.startsWith("http")) {
            fullUrl = new URL(href, this.baseUrl).toString(); // Use base URL for relative links
          }

          if (
            fullUrl.startsWith(baseUrl) && // Ensure it starts with the initial URL
            this.isInternalLink(fullUrl) &&
            this.noSections(fullUrl)
          ) {
            links.push(fullUrl);
          }
        }
      });

      return links.filter((link) => !this.visited.has(link));
    } catch (error) {
      return [];
    }
  }

  private noSections(link: string): boolean {
    return !link.includes("#");
  }

  private isInternalLink(link: string): boolean {
    const urlObj = new URL(link, this.baseUrl); // Use base URL for comparison
    const domainWithoutProtocol = this.baseUrl.replace(/^https?:\/\//, "");
    return urlObj.hostname === domainWithoutProtocol;
  }

  private isFile(url: string): boolean {
    const fileExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".css",
      ".js",
      ".ico",
      ".svg",
      ".pdf",
      ".zip",
      ".exe",
      ".dmg",
      ".mp4",
      ".mp3",
      ".pptx",
      ".docx",
      ".xlsx",
      ".xml",
    ];
    return fileExtensions.some((ext) => url.endsWith(ext));
  }
  private isSocialMediaOrEmail(url: string) {
    // make sure that the url doesn't include any of the social media or email
    const socialMediaOrEmail = [
      "facebook.com",
      "twitter.com",
      "linkedin.com",
      "instagram.com",
      "pinterest.com",
      "mailto:",
    ];
    return socialMediaOrEmail.some((ext) => url.includes(ext));
  }

  private async tryFetchSitemapLinks(url: string): Promise<string[]> {
    const sitemapUrl = url.endsWith("/sitemap.xml")
      ? url
      : `${url}/sitemap.xml`;
    try {
      const response = await axios.get(sitemapUrl);
      if (response.status === 200) {
        return await getLinksFromSitemap(sitemapUrl);
      }
    } catch (error) {
      //   console.log('No sitemap found at ' + sitemapUrl + ', proceeding with crawl.');
    }
    return [];
  }
}
