import { Queue } from "~/utils/queue.server";
import { openai } from "~/utils/providers.server";
import { logAPICall } from "~/routes/articles.new/logging.server";
import { LLMS } from "~/routes/articles.new/actions.server";
import { prisma } from "~/db.server";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  extractLinksSystemPrompt,
  extractLinksUserPrompt,
  OutputSchema,
  validateExtractedLinks,
} from "~/routes/articles.new/link-extraction-prompts.server";

interface ExtractLinksJob {
  productId: string;
}

async function extractRelevantLinks(
  content: string,
  baseUrl: string,
  productId: string,
) {
  console.log(
    `\n🔗 [extractRelevantLinks] EXTRACTING RELEVANT LINKS for product ${productId}`,
  );
  console.log(`🌐 Base URL: ${baseUrl}`);
  console.log(`📄 Content length: ${content.length} characters`);

  const prompt = extractLinksUserPrompt({ baseUrl, content });
  console.log(`🧠 Prompt generated. Length: ${prompt.length} characters`);

  try {
    console.log(`🤖 [extractRelevantLinks] Calling OpenAI API...`);

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: extractLinksSystemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 16383,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: zodResponseFormat(OutputSchema, "extracted_links"),
    });

    console.log(`✅ [extractRelevantLinks] OpenAI API call successful`);

    if (completion.choices[0].message.refusal) {
      console.log(
        `⚠️ [extractRelevantLinks] Model refused to respond:`,
        completion.choices[0].message.refusal,
      );
      return { links: [], productId };
    }

    const extractedLinks = completion.choices[0].message.parsed;
    const validatedLinks = validateExtractedLinks(extractedLinks);

    console.log(
      `🔍 [extractRelevantLinks] RELEVANT LINKS EXTRACTED: ${validatedLinks.extracted_links.length} links found`,
    );
    console.log(`📝 [extractRelevantLinks] Logging API call...`);
    await logAPICall({
      llm: LLMS.EXTRACT_RELEVANT_LINKS,
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response: JSON.stringify(validatedLinks),
    });
    console.log(`✅ [extractRelevantLinks] API call logged successfully`);

    return { links: validatedLinks.extracted_links, productId };
  } catch (error) {
    console.error(
      `❌ [extractRelevantLinks] ERROR EXTRACTING RELEVANT LINKS:`,
      error,
    );
    throw error;
  }
}

export const extractRelevantLinksQueue = Queue<ExtractLinksJob>(
  "extractRelevantLinks",
  async (job) => {
    console.log(
      `\n🚀 [extractRelevantLinksQueue] Starting job for product ID: ${job.data.productId}`,
    );

    const { productId } = job.data;

    console.log(
      `🔍 [extractRelevantLinksQueue] Fetching product from database...`,
    );
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { scrapedWebsites: true },
    });

    if (!product || !product.scrapedWebsites[0]) {
      console.error(
        `❌ [extractRelevantLinksQueue] Product not found or has no data`,
      );
      throw new Error(`Product with id ${productId} not found or has no data`);
    }
    console.log(`✅ [extractRelevantLinksQueue] Product found`);

    const content = product.scrapedWebsites[0].content;
    const baseUrl = product.baseUrl;

    if (!content) {
      console.error(`❌ [extractRelevantLinksQueue] Content not found`);
      throw new Error(`Content for product with id ${productId} not found`);
    }
    console.log(
      `📄 [extractRelevantLinksQueue] Content retrieved. Length: ${content.length} characters`,
    );
    console.log(`🌐 [extractRelevantLinksQueue] Base URL: ${baseUrl}`);

    console.log(`🔗 [extractRelevantLinksQueue] Extracting relevant links...`);
    const { links } = await extractRelevantLinks(content, baseUrl, productId);
    console.log(
      `✅ [extractRelevantLinksQueue] Relevant links extracted successfully`,
    );

    console.log(`🏁 [extractRelevantLinksQueue] Job completed successfully!`);
    // TODO - change Prisma schema so that relevantUrls is an array LinkSchema
    return {
      relevantUrls: [...links.map((link) => link.url).slice(0, 4)],
    };
  },
);
