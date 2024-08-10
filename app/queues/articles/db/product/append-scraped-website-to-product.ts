import { Queue } from "~/utils/queue.server";
import { prisma } from "~/db.server";
import invariant from "tiny-invariant";

export type UpdateProductFromChildrenQueueData = {
  productId: string;
};

export const appendScrapedWebsiteToProductQueue =
  Queue<UpdateProductFromChildrenQueueData>(
    "appendScrapedWebsiteToProduct",
    async (job) => {
      console.log(
        `🚀 [appendScrapedWebsiteToProduct] Starting job for product ID: ${job.data.productId}`,
      );

      invariant(
        job.data.productId,
        "Product ID is required to update a product",
      );

      console.log(
        `📥 [appendScrapedWebsiteToProduct] Fetching children values...`,
      );
      const childrenValues = await job.getChildrenValues();
      const data = Object.values(childrenValues)[0];

      console.log(
        `🌐 [appendScrapedWebsiteToProduct] Creating ScrapedWebsite...`,
      );
      const scrapedWebsite = await prisma.scrapedWebsite.create({
        data: {
          url: data.url,
          content: data.content,
          productId: job.data.productId,
        },
      });
      console.log(
        `✅ [appendScrapedWebsiteToProduct] ScrapedWebsite created with ID: ${scrapedWebsite.id}`,
      );

      console.log(`🔄 [appendScrapedWebsiteToProduct] Updating Product...`);
      const updatedProduct = await prisma.product.update({
        where: { id: job.data.productId },
        data: {
          scrapedWebsites: {
            connect: { id: scrapedWebsite.id },
          },
        },
      });

      console.log(
        `🏁 [appendScrapedWebsiteToProduct] Job completed successfully!`,
      );
      return updatedProduct;
    },
  );
