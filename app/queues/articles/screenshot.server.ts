import { Queue } from "~/utils/queue.server";
import axios from "axios";
import { uploadScreenshot } from "~/utils/cloudinary.server";
import { prisma } from "~/db.server";

interface ScreenshotJob {
  productId: string;
}

async function getScreenshot(url: string): Promise<string> {
  console.log(`\n📸 GETTING SCREENSHOT: ${url}`);
  const jinaApiKey = process.env.JINA_API_KEY;
  if (!jinaApiKey) {
    throw new Error("JINA_API_KEY is not defined in environment variables");
  }

  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers = {
    Authorization: `Bearer ${jinaApiKey}`,
    "X-Return-Format": "screenshot",
  };

  try {
    const response = await axios.get(jinaUrl, {
      headers,
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    console.log(`✅ SCREENSHOT CAPTURED: ${url}`);
    console.log(`🖼️ Screenshot size: ${buffer.length} bytes`);

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: "image/png" });

    const uploadResult = (await uploadScreenshot(blob)) as {
      secure_url: string;
    };
    if (!uploadResult.secure_url) {
      throw new Error("Invalid upload result");
    }
    console.log(`📤 SCREENSHOT UPLOADED: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (error) {
    console.error(`❌ ERROR GETTING SCREENSHOT FOR ${url}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get screenshot for ${url}: ${error.message}`);
    } else {
      throw new Error(`Failed to get screenshot for ${url}: Unknown error`);
    }
  }
}

export const screenshotQueue = Queue<ScreenshotJob>(
  "screenshot",
  async (job) => {
    const product = await prisma.product.findUnique({
      where: { id: job.data.productId },
    });

    const { baseUrl } = product;

    try {
      const screenshotUrl = await getScreenshot(baseUrl);
      return {
        screenshot: screenshotUrl,
      };
    } catch (error) {
      console.error(`Error processing screenshot job for ${baseUrl}:`, error);
      throw error;
    }
  },
);
