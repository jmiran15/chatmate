import { FlowProducer } from "bullmq";
import { redis } from "~/utils/redis.server";
import { extractRelevantLinksQueue } from "~/queues/articles/extract-relevant-links.server";
import { extractProductInfoQueue } from "~/queues/articles/extract-product-info.server";
import { prisma } from "~/db.server";
import { appendScrapedWebsiteToProductQueue } from "~/queues/articles/db/product/append-scraped-website-to-product";
import { addChildScrapesQueue } from "~/queues/articles/addChildScrapes.server";
import { updateProductFromChildrenQueue } from "~/queues/articles/db/product/update-product-from-child.server";
import { scrapeJinaQueue } from "~/queues/articles/scrape-url.server";
import { ActionFunctionArgs, json } from "@remix-run/node";

export async function startExtractionFlow(articleId: string) {
  const flowProducer = new FlowProducer({ connection: redis });
  console.log(`\n🚀 Starting Extraction Flow for Article ID: ${articleId}`);

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { products: true },
  });

  if (!article) {
    console.error(`❌ Article with ID ${articleId} not found`);
    throw new Error(`Article with id ${articleId} not found`);
  }
  // TODO - add a root queue which formats all of the extractions + creates the fake claudinary links, and writes to a file when finished - the file should have exactly the user prompt so we can copy paste directly into user prompt

  const flow = await flowProducer.addBulk(
    article.products.map((product) => ({
      name: `extract-product-info-${product.id}`,
      queueName: extractProductInfoQueue.name,
      data: { productId: product.id },
      opts: { ignoreDependencyOnFailure: true },
      children: [
        {
          name: `scrape-relevant-urls-${product.id}`,
          queueName: addChildScrapesQueue.name,
          data: { productId: product.id },
          opts: { ignoreDependencyOnFailure: true },
          children: [
            {
              name: `update-product-${product.id}-relevant-urls-db`,
              queueName: updateProductFromChildrenQueue.name,
              data: { productId: product.id },
              opts: { ignoreDependencyOnFailure: true },
              children: [
                {
                  name: `extract-relevant-urls-${product.id}`,
                  queueName: extractRelevantLinksQueue.name,
                  data: { productId: product.id },
                  opts: { ignoreDependencyOnFailure: true },
                  children: [
                    {
                      name: `append-scraped-website-to-product-${product.id}`,
                      queueName: appendScrapedWebsiteToProductQueue.name,
                      data: { productId: product.id },
                      opts: { ignoreDependencyOnFailure: true },
                      children: [
                        {
                          name: `scrape-base-${product.id}`,
                          queueName: scrapeJinaQueue.name,
                          data: { url: product.baseUrl },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })),
  );

  return flow;
}

export async function loader() {
  console.log("loader");
  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;
  return json({ headers });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = JSON.parse(await request.text());

  //   model Article {
  //     id              String      @id @default(cuid())
  //     createdAt       DateTime    @default(now())
  //     updatedAt       DateTime    @updatedAt
  //     userId          String
  //     type            ArticleType @default(ALTERNATIVE)
  //     instructions    String?
  //     title           String
  //     markdownContent String?
  //     wordCount       Int?
  //     readingTimeMs   Int?
  //     user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  //     products        Product[]

  //     @@index([userId])
  //   }

  //   model Product {
  //     id                   String           @id @default(cuid())
  //     createdAt            DateTime         @default(now())
  //     updatedAt            DateTime         @updatedAt
  //     position             Int
  //     article              Article          @relation(fields: [articleId], references: [id], onDelete: Cascade)
  //     articleId            String
  //     screenshot           String?
  //     scrapedWebsites      ScrapedWebsite[]
  //     relevantUrls         String[]
  //     baseUrl              String
  //     extractedProductInfo Json?
  //   }

  // the body will have a string array of product urls, you need to turn those into products, and create the article with them
  const { productUrls, userId } = body;

  const article = await prisma.article.create({
    data: {
      userId,
      type: "ALTERNATIVE",
      title: "Extraction Flow",
      products: {
        create: productUrls.map((url: string, index: number) => ({
          baseUrl: url,
          position: index,
        })),
      },
    },
  });

  await startExtractionFlow(article.id);

  const corsHeader =
    process.env.NODE_ENV === "production"
      ? {
          "Access-Control-Allow-Origin": "*",
        }
      : {};
  const headers = {
    ...corsHeader,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as HeadersInit;

  return json({}, { headers });
}
