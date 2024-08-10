import { Queue } from "~/utils/queue.server";
import { Job, FlowProducer, WaitingChildrenError } from "bullmq";
import { flowProducer } from "~/flows/article-generation.server";
import { scrapeJinaQueue } from "./scrape-url.server";
import { prisma } from "~/db.server";
import { appendScrapedWebsiteToProductQueue } from "./db/product/append-scraped-website-to-product";

interface AddChildScrapesJob {
  productId: string;
  step: Step;
}

enum Step {
  Initial,
  WaitForChildren,
  Finish,
}

async function handler(job: Job<AddChildScrapesJob>): Promise<void> {
  console.log(
    `🚀 [addChildScrapes] Starting job for product ID: ${job.data.productId}`,
  );
  let step = job.data.step || Step.Initial;

  while (step !== Step.Finish) {
    console.log(`🔄 [addChildScrapes] Current step: ${Step[step]}`);
    switch (step) {
      case Step.Initial: {
        console.log(`🔍 [addChildScrapes] Fetching product from database...`);
        const product = await prisma.product.findUnique({
          where: { id: job.data.productId },
        });

        if (!product || !product.relevantUrls) {
          console.error(
            `❌ [addChildScrapes] Product not found or has no relevant URLs`,
          );
          throw new Error(`Product with id ${job.data.productId} not found`);
        }

        const relevantUrls = product.relevantUrls;
        console.log(
          `✅ [addChildScrapes] Found ${relevantUrls.length} relevant URLs`,
        );

        console.log(
          `🔗 [addChildScrapes] Adding bulk jobs to flow producer...`,
        );
        await flowProducer.addBulk(
          relevantUrls.map((url: string) => ({
            name: `append-scraped-website-${url}`,
            queueName: appendScrapedWebsiteToProductQueue.name,
            data: { productId: job.data.productId },
            children: [
              {
                name: `scrape-url-${url}`,
                queueName: scrapeJinaQueue.name,
                data: { url },
              },
            ],
            opts: {
              parent: {
                id: job.id!,
                queue: job.queueQualifiedName,
              },
            },
          })),
        );
        console.log(`✅ [addChildScrapes] Bulk jobs added successfully`);

        console.log(
          `📝 [addChildScrapes] Updating job data to WaitForChildren step`,
        );
        await job.updateData({
          ...job.data,
          step: Step.WaitForChildren,
        });
        step = Step.WaitForChildren;
        break;
      }
      case Step.WaitForChildren: {
        console.log(`⏳ [addChildScrapes] Waiting for children jobs...`);
        const token = job.token;
        if (!token) {
          console.error(`❌ [addChildScrapes] No token found`);
          throw new Error("No token found");
        }
        const shouldWait = await job.moveToWaitingChildren(token);
        if (!shouldWait) {
          console.log(`✅ [addChildScrapes] All children jobs completed`);
          console.log(`📝 [addChildScrapes] Updating job data to Finish step`);
          await job.updateData({
            ...job.data,
            step: Step.Finish,
          });
          step = Step.Finish;
          return;
        } else {
          console.log(`⏳ [addChildScrapes] Still waiting for children jobs`);
          throw new WaitingChildrenError();
        }
      }
      default: {
        console.error(`❌ [addChildScrapes] Invalid step: ${step}`);
        throw new Error("Invalid step");
      }
    }
  }
  console.log(`🏁 [addChildScrapes] Job completed successfully!`);
}

export const addChildScrapesQueue = Queue<AddChildScrapesJob>(
  "addChildScrapes",
  handler,
);
