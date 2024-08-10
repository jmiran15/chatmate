import { Queue } from "~/utils/queue.server";
import { openai } from "~/utils/providers.server";
import {
  extractInfoUserPrompt,
  combineExtractedInfoUserPrompt,
} from "~/routes/articles.new/prompts.server";
import { logAPICall } from "~/routes/articles.new/logging.server";
import { Tiktoken } from "tiktoken/lite";
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
import { LLMS } from "~/routes/articles.new/actions.server";
import { prisma } from "~/db.server";
import type { ScrapedWebsite } from "@prisma/client";

interface ExtractProductInfoJob {
  productId: string;
}
const MAX_TOKENS = 64000; // limit is 128k input, 16k output

let encoder: Tiktoken;

async function initEncoder() {
  if (!encoder) {
    console.log(`🔧 [extractProductInfo] Initializing encoder...`);
    encoder = new Tiktoken(
      cl100k_base.bpe_ranks,
      cl100k_base.special_tokens,
      cl100k_base.pat_str,
    );
    console.log(`✅ [extractProductInfo] Encoder initialized successfully`);
  }
}

function estimateTokenCount(text: string): number {
  if (!encoder) {
    console.error(`❌ [extractProductInfo] Encoder not initialized`);
    throw new Error("Encoder not initialized");
  }
  const tokenCount = encoder.encode(text).length;
  console.log(`📊 [extractProductInfo] Estimated token count: ${tokenCount}`);
  return tokenCount;
}

export const extractProductInfoQueue = Queue<ExtractProductInfoJob>(
  "extractProductInfo",
  async (job) => {
    const { productId } = job.data;
    console.log(
      `\n🚀 [extractProductInfo] Starting Product Info Extraction for Product ID: ${productId}`,
    );

    console.log(`🔍 [extractProductInfo] Fetching product from database...`);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { scrapedWebsites: true },
    });

    if (!product) {
      console.error(
        `❌ [extractProductInfo] Product with ID ${productId} not found`,
      );
      throw new Error(`Product with id ${productId} not found`);
    }
    console.log(`✅ [extractProductInfo] Product found`);

    const websites = product.scrapedWebsites;
    await initEncoder();
    console.log(
      `📚 [extractProductInfo] Processing ${websites.length} scraped contents for product`,
    );

    async function extractBatch(websites: ScrapedWebsite[]): Promise<string> {
      console.log(
        `🔄 [extractBatch] Starting batch extraction for ${websites.length} websites`,
      );
      const prompt = extractInfoUserPrompt({ websites });
      const estimatedTokens = estimateTokenCount(prompt);
      console.log(
        `🔗 [extractBatch] Estimated tokens for extraction: ${estimatedTokens}`,
      );

      if (estimatedTokens > MAX_TOKENS) {
        console.log(
          `⚠️ [extractBatch] Token limit exceeded. Splitting content for processing.`,
        );
        return await splitAndExtract(websites);
      }

      try {
        console.log(
          `🤖 [extractBatch] Sending request to OpenAI for content extraction...`,
        );
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: "json_object" },
        });

        const response = completion.choices[0].message?.content || "{}";
        console.log(`✅ [extractBatch] Content extraction successful`);
        console.log(`   📊 Response length: ${response.length} characters`);

        console.log(`📝 [extractBatch] Logging API call...`);
        await logAPICall({
          llm: LLMS.EXTRACT_PRODUCT_INFO,
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response,
        });

        return response;
      } catch (error) {
        console.error(
          `❌ [extractBatch] Error extracting product info:`,
          error,
        );
        throw new Error(
          `Failed to extract product info: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    async function splitAndExtract(
      websites: ScrapedWebsite[],
    ): Promise<string> {
      console.log(`🔪 [splitAndExtract] Splitting content for processing...`);
      try {
        if (websites.length > 1) {
          const mid = Math.floor(websites.length / 2);
          console.log(
            `🔄 [splitAndExtract] Processing first half (${mid} websites)...`,
          );
          const firstHalfResult = await extractBatch(websites.slice(0, mid));
          console.log(
            `🔄 [splitAndExtract] Processing second half (${
              websites.length - mid
            } websites)...`,
          );
          const secondHalfResult = await extractBatch(websites.slice(mid));
          return await combineResults(firstHalfResult, secondHalfResult);
        } else {
          const website = websites[0];
          const mid = Math.floor(website.content.length / 2);
          console.log(
            `🔄 [splitAndExtract] Processing first half of content...`,
          );
          const firstHalfResult = await extractBatch([
            { content: website.content.slice(0, mid), url: website.url },
          ]);
          console.log(
            `🔄 [splitAndExtract] Processing second half of content...`,
          );
          const secondHalfResult = await extractBatch([
            { content: website.content.slice(mid), url: website.url },
          ]);
          return await combineResults(firstHalfResult, secondHalfResult);
        }
      } catch (error) {
        console.error(
          `❌ [splitAndExtract] ERROR SPLITTING AND EXTRACTING:`,
          error,
        );
        throw new Error(
          `Failed to split and extract: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    async function combineResults(
      result1: string,
      result2: string,
    ): Promise<string> {
      console.log(`🔗 [combineResults] Combining extracted results...`);
      const combinedPrompt = combineExtractedInfoUserPrompt({
        result1,
        result2,
      });

      try {
        console.log(
          `🤖 [combineResults] Sending request to OpenAI for combining results...`,
        );
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: combinedPrompt }],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: "json_object" },
        });

        const response = completion.choices[0].message?.content || "{}";
        console.log(`✅ [combineResults] Results combined successfully`);

        console.log(`📝 [combineResults] Logging API call...`);
        await logAPICall({
          llm: LLMS.COMBINE_RESULTS,
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: combinedPrompt }],
          response,
        });

        return response;
      } catch (error) {
        console.error(`❌ [combineResults] ERROR COMBINING RESULTS:`, error);
        throw new Error(
          `Failed to combine results: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    const result = await extractBatch(websites);
    console.log(`✅ [extractProductInfo] Product info extraction completed`);
    console.log(`   📊 Extracted info length: ${result.length} characters`);
    return { extractedProductInfo: result };
  },
);
