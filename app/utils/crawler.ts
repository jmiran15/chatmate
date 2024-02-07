import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

interface Page {
  url: string;
  content: string;
}

class Crawler {
  private seen = new Set<string>();
  private pages: Page[] = [];
  private queue: { url: string; depth: number }[] = [];

  constructor(
    private maxDepth = 2,
    private maxPages = 1,
  ) {}

  async crawl(startUrl: string): Promise<Page[]> {
    // Add the start URL to the queue
    this.addToQueue(startUrl);

    // While there are URLs in the queue and we haven't reached the maximum number of pages...
    while (this.shouldContinueCrawling()) {
      // Dequeue the next URL and depth
      const { url, depth } = this.queue.shift()!;

      // If the depth is too great or we've already seen this URL, skip it
      if (this.isTooDeep(depth) || this.isAlreadySeen(url)) continue;

      // Add the URL to the set of seen URLs
      this.seen.add(url);

      // Fetch the page HTML
      const html = await this.fetchPage(url);

      // Parse the HTML and add the page to the list of crawled pages
      this.pages.push({ url, content: this.parseHtml(html) });

      // Extract new URLs from the page HTML and add them to the queue
      this.addNewUrlsToQueue(this.extractUrls(html, url), depth);
    }

    // Return the list of crawled pages
    return this.pages;
  }

  private isTooDeep(depth: number) {
    return depth > this.maxDepth;
  }

  private isAlreadySeen(url: string) {
    return this.seen.has(url);
  }

  private shouldContinueCrawling() {
    return this.queue.length > 0 && this.pages.length < this.maxPages;
  }

  private addToQueue(url: string, depth = 0) {
    this.queue.push({ url, depth });
  }

  private addNewUrlsToQueue(urls: string[], depth: number) {
    this.queue.push(...urls.map((url) => ({ url, depth: depth + 1 })));
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}: ${error}`);
      return "";
    }
  }

  private parseHtml(html: string): string {
    const $ = cheerio.load(html);
    $("a").removeAttr("href");
    return NodeHtmlMarkdown.translate($.html());
  }

  private extractUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const relativeUrls = $("a")
      .map((_, link) => $(link).attr("href"))
      .get() as string[];
    return relativeUrls.map(
      (relativeUrl) => new URL(relativeUrl, baseUrl).href,
    );
  }
}

export { Crawler };
export type { Page };

// this:
// 1. creates crawler
// 2. crawls the url and returns page[]
// 3. calls prepareDocuments which calls the splitter on them and returns them as Document[]
// 4. embed documents and upsert them

// import { getEmbeddings } from "@/utils/embeddings";
// import {
//   Document,
//   MarkdownTextSplitter,
//   RecursiveCharacterTextSplitter,
// } from "@pinecone-database/doc-splitter";
// import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
// import { chunkedUpsert } from "../../utils/chunkedUpsert";
// import md5 from "md5";
// import { Crawler, Page } from "./crawler";
// import { truncateStringByBytes } from "@/utils/truncateString";

// interface SeedOptions {
//   splittingMethod: string;
//   chunkSize: number;
//   chunkOverlap: number;
// }

// type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter;

// async function seed(
//   url: string,
//   limit: number,
//   indexName: string,
//   options: SeedOptions,
// ) {
//   try {
//     // Initialize the Pinecone client
//     const pinecone = new Pinecone();

//     // Destructure the options object
//     const { splittingMethod, chunkSize, chunkOverlap } = options;

//     // Create a new Crawler with depth 1 and maximum pages as limit
//     const crawler = new Crawler(1, limit || 100);

//     // Crawl the given URL and get the pages
//     const pages = (await crawler.crawl(url)) as Page[];

//     // Choose the appropriate document splitter based on the splitting method
//     const splitter: DocumentSplitter =
//       splittingMethod === "recursive"
//         ? new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })    // this is the one we have
//         : new MarkdownTextSplitter({});

//     // Prepare documents by splitting the pages
//     const documents = await Promise.all(
//       pages.map((page) => prepareDocument(page, splitter)),
//     );

//     // Create Pinecone index if it does not exist
//     const indexList = await pinecone.listIndexes();
//     const indexExists = indexList.some((index) => index.name === indexName);
//     if (!indexExists) {
//       await pinecone.createIndex({
//         name: indexName,
//         dimension: 1536,
//         waitUntilReady: true,
//       });
//     }

//     const index = pinecone.Index(indexName);

//     // Get the vector embeddings for the documents
//     const vectors = await Promise.all(documents.flat().map(embedDocument));

//     // Upsert vectors into the Pinecone index
//     await chunkedUpsert(index!, vectors, "", 10);

//     // Return the first document
//     return documents[0];
//   } catch (error) {
//     console.error("Error seeding:", error);
//     throw error;
//   }
// }

// async function embedDocument(doc: Document): Promise<PineconeRecord> {
//   try {
//     // Generate OpenAI embeddings for the document content
//     const embedding = await getEmbeddings(doc.pageContent);

//     // Create a hash of the document content
//     const hash = md5(doc.pageContent);

//     // Return the vector embedding object
//     return {
//       id: hash, // The ID of the vector is the hash of the document content
//       values: embedding, // The vector values are the OpenAI embeddings
//       metadata: {
//         // The metadata includes details about the document
//         chunk: doc.pageContent, // The chunk of text that the vector represents
//         text: doc.metadata.text as string, // The text of the document
//         url: doc.metadata.url as string, // The URL where the document was found
//         hash: doc.metadata.hash as string, // The hash of the document content
//       },
//     } as PineconeRecord;
//   } catch (error) {
//     console.log("Error embedding document: ", error);
//     throw error;
//   }
// }

// async function prepareDocument(
//   page: Page,
//   splitter: DocumentSplitter,
// ): Promise<Document[]> {
//   // Get the content of the page
//   const pageContent = page.content;

//   // Split the documents using the provided splitter
//   const docs = await splitter.splitDocuments([
//     new Document({
//       pageContent,
//       metadata: {
//         url: page.url,
//         // Truncate the text to a maximum byte length
//         text: truncateStringByBytes(pageContent, 36000),
//       },
//     }),
//   ]);

//   // Map over the documents and add a hash to their metadata
//   return docs.map((doc: Document) => {
//     return {
//       pageContent: doc.pageContent,
//       metadata: {
//         ...doc.metadata,
//         // Create a hash of the document content
//         hash: md5(doc.pageContent),
//       },
//     };
//   });
// }

// export default seed;
