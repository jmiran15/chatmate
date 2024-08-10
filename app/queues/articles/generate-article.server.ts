import { Queue } from "~/utils/queue.server";
import { openai } from "~/utils/providers.server";
import { prisma } from "~/db.server";
import {
  generateBlogSystemPrompt,
  generateBlogUserPrompt,
} from "~/routes/articles.new/prompts.server";
import { logAPICall } from "~/routes/articles.new/logging.server";
import { LLMS } from "~/routes/articles.new/actions.server";

interface GenerateArticleJob {
  articleId: string;
}

export const generateArticleQueue = Queue<GenerateArticleJob>(
  "generateArticle",
  async (job) => {
    try {
      console.log(
        `🚀 [generateArticle] Starting article generation for Article ID: ${job.data.articleId}`,
      );
      const { articleId } = job.data;

      console.log(`🔍 [generateArticle] Fetching article from database...`);
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { products: { include: { scrapedWebsites: true } } },
      });

      if (!article) {
        console.error(
          `❌ [generateArticle] Article with ID ${articleId} not found`,
        );
        throw new Error(`Article with id ${articleId} not found`);
      }
      console.log(`✅ [generateArticle] Article found`);

      if (!article.products || article.products.length === 0) {
        console.error(
          `❌ [generateArticle] No products found for Article ID ${articleId}`,
        );
        throw new Error(`No products found for Article ID ${articleId}`);
      }

      console.log(`📊 [generateArticle] Preparing extracted sections...`);
      const extractedSections = article.products.map((product) => {
        if (!product.baseUrl) {
          console.warn(
            `⚠️ [generateArticle] Missing baseUrl for product ${product.id}`,
          );
        }
        if (!product.extractedProductInfo) {
          console.warn(
            `⚠️ [generateArticle] Missing extractedProductInfo for product ${product.id}`,
          );
        }
        return {
          url: product.baseUrl || "",
          screenshotUrl: product.screenshot || "",
          extractedInfo: (product.extractedProductInfo as string) || "",
        };
      });
      console.log(
        `📊 [generateArticle] Number of extracted sections: ${extractedSections.length}`,
      );

      if (extractedSections.length === 0) {
        console.error(`❌ [generateArticle] No valid extracted sections found`);
        throw new Error(
          `No valid extracted sections found for Article ID ${articleId}`,
        );
      }

      console.log(`🧠 [generateArticle] Generating prompts...`);
      const systemPrompt = generateBlogSystemPrompt();
      const userPrompt = generateBlogUserPrompt({ extractedSections });
      console.log(`✅ [generateArticle] Prompts generated`);

      console.log(
        `🤖 [generateArticle] Sending request to OpenAI for article generation...`,
      );

      console.log(`📝 [extractRelevantLinks] Logging API call...`);
      await logAPICall({
        llm: LLMS.GENERATE_CONTENT,
        timestamp: new Date().toISOString(),
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response: "",
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 16383,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        // response_format: {
        //   type: "json_object",
        // },
      });
      console.log(`✅ [generateArticle] OpenAI request completed`);

      const generatedContent = completion.choices[0].message?.content;
      if (!generatedContent) {
        console.error(`❌ [generateArticle] No content generated from OpenAI`);
        throw new Error(
          `No content generated from OpenAI for Article ID ${articleId}`,
        );
      }
      console.log(
        `📝 [generateArticle] Generated content length: ${generatedContent.length} characters`,
      );

      console.log(
        `🏁 [generateArticle] Article generation completed successfully`,
      );
      return { markdownContent: generatedContent };
    } catch (error) {
      console.error(
        `❌ [generateArticle] Error during article generation:`,
        error,
      );
      throw error; // Re-throw the error to be handled by the queue system
    }
  },
);
