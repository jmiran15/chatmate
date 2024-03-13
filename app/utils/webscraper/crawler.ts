import axios from "axios";
import cheerio from "cheerio";
import { URL } from "url";
import { getLinksFromSitemap } from "./sitemap";
import async from "async";
// import { glob } from "glob";
import { Progress } from "../types";

export class WebCrawler {
  private initialUrl: string;
  private baseUrl: string; // Added to store the base URL
  //   private includes: string[];
  //   private excludes: string[];
  private maxCrawledLinks: number;
  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  private visited: Set<string> = new Set();
  // eslint-disable-next-line @typescript-eslint/consistent-generic-constructors
  private crawledUrls: Set<string> = new Set();

  constructor({
    initialUrl,
    // includes,
    // excludes,
    maxCrawledLinks = 1000,
  }: {
    initialUrl: string;
    includes?: string[];
    excludes?: string[];
    maxCrawledLinks?: number;
  }) {
    this.initialUrl = initialUrl;
    this.baseUrl = new URL(initialUrl).origin; // Initialize the base URL
    // this.includes = includes ?? [];
    // this.excludes = excludes ?? [];
    this.maxCrawledLinks = maxCrawledLinks;
  }

  public async start(
    inProgress?: (progress: Progress) => void,
    concurrencyLimit = 5,
  ): Promise<string[]> {
    // Attempt to fetch and return sitemap links before any crawling
    const sitemapLinks = await this.tryFetchSitemapLinks(this.initialUrl);
    if (sitemapLinks.length > 0) {
      //   console.log('Sitemap found, returning sitemap links.');
      return sitemapLinks;
    }
    // Proceed with crawling if no sitemap links found
    return await this.crawlUrls(
      [this.initialUrl],
      concurrencyLimit,
      inProgress,
    );
  }

  private async crawlUrls(
    urls: string[],
    concurrencyLimit: number,
    inProgress?: (progress: Progress) => void,
  ): Promise<string[]> {
    const queue = async.queue(async (task: string, callback) => {
      console.log("type of callback", typeof callback);

      if (this.crawledUrls.size >= this.maxCrawledLinks) {
        callback();
        return;
      }
      const newUrls = await this.crawl(task);
      newUrls.forEach((url) => this.crawledUrls.add(url));
      if (inProgress && newUrls.length > 0) {
        inProgress({
          current: this.crawledUrls.size,
          total: this.maxCrawledLinks,
          status: "SCRAPING",
          currentDocumentUrl: newUrls[newUrls.length - 1],
        });
      } else if (inProgress) {
        inProgress({
          current: this.crawledUrls.size,
          total: this.maxCrawledLinks,
          status: "SCRAPING",
          currentDocumentUrl: task, // Fallback to the task URL if newUrls is empty
        });
      }
      await this.crawlUrls(newUrls, concurrencyLimit, inProgress);
      callback();
    }, concurrencyLimit);

    // queue.error(function (err, task) {
    //   console.error(err, task);
    // });

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

    // Perform the crawl
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const links: string[] = [];

      $("a").each((_, element) => {
        const href = $(element).attr("href");
        if (href) {
          let fullUrl = href;
          if (!href.startsWith("http")) {
            fullUrl = new URL(href, this.baseUrl).toString(); // Use base URL for relative links
          }
          if (
            fullUrl.startsWith(this.initialUrl) && // Ensure it starts with the initial URL
            this.isInternalLink(fullUrl) &&
            this.matchesPattern(fullUrl) &&
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

  // private matchesPattern(link: string): boolean {
  //   // TODO: implement pattern matching following the glob syntax
  //   return true;
  // }

  // function to check if the url is a file
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
        // console.log('Sitemap found at ' + sitemapUrl);
        return await getLinksFromSitemap(sitemapUrl);
      }
    } catch (error) {
      //   console.log('No sitemap found at ' + sitemapUrl + ', proceeding with crawl.');
    }
    return [];
  }
}
