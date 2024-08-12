import { FlowProducer } from "bullmq";
import { redis } from "~/utils/redis.server";
import { screenshotQueue } from "~/queues/articles/screenshot.server";
import { extractRelevantLinksQueue } from "~/queues/articles/extract-relevant-links.server";
import { extractProductInfoQueue } from "~/queues/articles/extract-product-info.server";
import { generateArticleQueue } from "~/queues/articles/generate-article.server";
import { prisma } from "~/db.server";
import { appendScrapedWebsiteToProductQueue } from "~/queues/articles/db/product/append-scraped-website-to-product";
import { addChildScrapesQueue } from "~/queues/articles/addChildScrapes.server";
import { updateProductFromChildrenQueue } from "~/queues/articles/db/product/update-product-from-child.server";
import { scrapeJinaQueue } from "~/queues/articles/scrape-url.server";
import { updateArticleQueue } from "~/queues/articles/update-article-from-child.server";

export const flowProducer = new FlowProducer({ connection: redis });

export async function startArticleGenerationFlow(articleId: string) {
  console.log(
    `\n🚀 Starting Article Generation Flow for Article ID: ${articleId}`,
  );

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      products: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!article) {
    console.error(`❌ Article with ID ${articleId} not found`);
    throw new Error(`Article with id ${articleId} not found`);
  }

  console.log(`📊 Article Details:`);
  console.log(`   📝 Title: ${article.title}`);
  console.log(`   🔢 Number of Products: ${article.products.length}`);

  const flow = await flowProducer.add({
    name: `update-article-${articleId}`,
    queueName: updateArticleQueue.name,
    data: { articleId },
    children: [
      {
        name: `generate-article-${articleId}`,
        queueName: generateArticleQueue.name,
        data: { articleId },
        opts: { ignoreDependencyOnFailure: true },
        children: article.products
          .map((product) => ({
            name: `update-product-${product.id}`,
            queueName: updateProductFromChildrenQueue.name,
            data: { productId: product.id },
            opts: { ignoreDependencyOnFailure: true },
            children: [
              {
                name: `screenshot-${product.id}`,
                queueName: screenshotQueue.name,
                data: { productId: product.id },
                opts: { ignoreDependencyOnFailure: true },
              },
            ],
          }))
          .concat(
            article.products.map((product) => ({
              name: `update-product-${product.id}-info`,
              queueName: updateProductFromChildrenQueue.name,
              data: { productId: product.id },
              opts: { ignoreDependencyOnFailure: true },
              children: [
                {
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
                                  queueName:
                                    appendScrapedWebsiteToProductQueue.name,
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
                },
              ],
            })),
          ),
      },
    ],
    opts: {
      jobId: `update-article-${articleId}`,
      ignoreDependencyOnFailure: true,
    },
  });

  console.log(`✅ Article Generation Flow started successfully`);
  console.log(`   🆔 Flow ID: ${flow.job.id}`);
  console.log(`   🔄 Total Jobs in Flow: ${flow.children?.length ?? 0}`);

  return flow;
}
