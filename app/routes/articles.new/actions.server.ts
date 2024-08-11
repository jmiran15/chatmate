import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { prisma } from "~/db.server";
import { ArticleType } from "@prisma/client";
import { requireUserId } from "~/session.server";
import { startArticleGenerationFlow } from "~/flows/article-generation.server";
import { redirect } from "@remix-run/node";

export const LLMS = {
  EXTRACT_RELEVANT_LINKS: "EXTRACT_RELEVANT_LINKS",
  EXTRACT_PRODUCT_INFO: "EXTRACT_PRODUCT_INFO",
  COMBINE_RESULTS: "COMBINE_RESULTS",
  GENERATE_CONTENT: "GENERATE_CONTENT",
};

const urlSchema = z.string().url();

const formSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters long"),
  instructions: z.string().optional(),
  rootUrl: urlSchema,
  alternativeProducts: z
    .array(urlSchema)
    .min(1, "At least one alternative product is required"),
});

export type ScrapedWebsite = {
  content: string;
  url: string;
};

export async function action({ request }: ActionFunctionArgs) {
  console.log("\n🚀 ACTION FUNCTION STARTED");
  const formData = await request.formData();
  const intent = formData.get("intent");

  console.log(`📝 INTENT: ${intent}`);

  switch (intent) {
    case "create-article": {
      console.log("\n📄 CREATE ARTICLE PROCESS STARTED");
      const title = formData.get("title");
      const instructions = formData.get("instructions");
      const rootUrl = formData.get("rootUrl");
      const alternativeProducts = formData.getAll("alternativeProducts");

      console.log("📊 RECEIVED FORM DATA:");
      console.log(
        JSON.stringify(
          { title, instructions, rootUrl, alternativeProducts },
          null,
          2,
        ),
      );

      const result = formSchema.safeParse({
        title,
        instructions,
        rootUrl,
        alternativeProducts,
      });

      if (!result.success) {
        console.log("❌ VALIDATION ERRORS:");
        console.log(
          JSON.stringify(result.error.flatten().fieldErrors, null, 2),
        );
        return json(
          { errors: result.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      console.log("✅ FORM DATA VALIDATED SUCCESSFULLY");

      const { data } = result;

      // Improve duplicate URL check
      const uniqueUrls = new Set(data.alternativeProducts);
      if (
        uniqueUrls.size !== data.alternativeProducts.length ||
        uniqueUrls.has(data.rootUrl)
      ) {
        console.log("❌ DUPLICATE URLs FOUND IN ALTERNATIVE PRODUCTS");
        return json(
          {
            errors: {
              alternativeProducts: [
                "Duplicate URLs are not allowed in the alternative products list",
              ],
            },
          },
          { status: 400 },
        );
      }

      // Check if root URL is in alternative products
      if (data.alternativeProducts.includes(data.rootUrl)) {
        console.log("❌ ROOT URL FOUND IN ALTERNATIVE PRODUCTS");
        return json(
          {
            errors: {
              alternativeProducts: [
                "The root product URL should not be included in the alternative products list",
              ],
            },
          },
          { status: 400 },
        );
      }

      console.log("✅ ALL VALIDATIONS PASSED");

      const userId = await requireUserId(request);
      console.log(`👤 USER ID: ${userId}`);

      // Create the article
      const article = await prisma.article.create({
        data: {
          title: data.title,
          instructions: data.instructions,
          type: ArticleType.ALTERNATIVE,
          userId,
          products: {
            create: [
              { baseUrl: data.rootUrl, position: 0 },
              ...data.alternativeProducts.map((url, index) => ({
                baseUrl: url,
                position: index + 1,
              })),
            ],
          },
        },
      });

      console.log(`📝 ARTICLE CREATED: ${article.id}`);

      const flow = await startArticleGenerationFlow(article.id);

      return redirect(`/articles/${article.id}/progress`);
    }
    default:
      console.log(`❌ INVALID INTENT: ${intent}`);
      throw new Error("Invalid intent");
  }
}
