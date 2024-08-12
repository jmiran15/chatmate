// TODO - this is soley for generating synthetic training data for the LLM finetuning

// import { FlowProducer } from "bullmq";
// import { redis } from "~/utils/redis.server";
// import { prisma } from "~/db.server";
// import { appendScrapedWebsiteToProductQueue } from "~/queues/articles/db/product/append-scraped-website-to-product";
// import { updateProductFromChildrenQueue } from "~/queues/articles/db/product/update-product-from-child.server";
// import { scrapeJinaQueue } from "~/queues/articles/scrape-url.server";
// import { ActionFunctionArgs, json } from "@remix-run/node";
// import { formatExtractedInfoQueue } from "~/queues/articles/format-extracted-info.server";
// import { extractfromblog } from "~/queues/articles/extractProdInfoFromBLOG-synethic.server";
// import fs from "fs/promises";
// import path from "path";
// import os from "os";
// import { openai } from "~/utils/providers.server";

// // Dummy function to extract product URLs
// function extractProductUrls(content: string): string[] {
//   // In a real implementation, this would call OpenAI or use some other method
//   // For now, we'll just return some dummy URLs
//   return [
//     "https://example.com/product1",
//     "https://example.com/product2",
//     "https://example.com/product3",
//   ];
// }

// export async function startExtractionFlow(articleId: string) {
//   const flowProducer = new FlowProducer({ connection: redis });
//   console.log(`\n🚀 Starting Extraction Flow for Article ID: ${articleId}`);

//   const article = await prisma.article.findUnique({
//     where: { id: articleId },
//     include: {
//       products: {
//         orderBy: {
//           position: "asc",
//         },
//       },
//     },
//   });

//   if (!article) {
//     console.error(`❌ Article with ID ${articleId} not found`);
//     throw new Error(`Article with id ${articleId} not found`);
//   }

//   const flow = await flowProducer.add({
//     name: "log-extraction-flow",
//     queueName: formatExtractedInfoQueue.name,
//     data: { articleId },
//     opts: { ignoreDependencyOnFailure: true },
//     children: article.products.map((product) => ({
//       name: `update-product-${product.id}-info`,
//       queueName: updateProductFromChildrenQueue.name,
//       data: { productId: product.id },
//       opts: { ignoreDependencyOnFailure: true },
//       children: [
//         {
//           name: `extract-product-info-${product.id}`,
//           queueName: extractfromblog.name,
//           data: { productId: product.id },
//           opts: { ignoreDependencyOnFailure: true },
//           // children: [
//           //   {
//           //     name: `append-scraped-website-to-product-${product.id}`,
//           //     queueName: appendScrapedWebsiteToProductQueue.name,
//           //     data: { productId: product.id },
//           //     opts: { ignoreDependencyOnFailure: true },
//           //     children: [
//           //       {
//           //         name: `scrape-base-${product.id}`,
//           //         queueName: scrapeJinaQueue.name,
//           //         data: { url: product.baseUrl },
//           //       },
//           //     ],
//           //   },
//           // ],
//         },
//       ],
//     })),
//   });

//   return flow;
// }

// export async function loader() {
//   console.log("loader");
//   const corsHeader =
//     process.env.NODE_ENV === "production"
//       ? {
//           "Access-Control-Allow-Origin": "*",
//         }
//       : {};
//   const headers = {
//     ...corsHeader,
//     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type",
//   } as HeadersInit;
//   return json({ headers });
// }

// export async function action({ request }: ActionFunctionArgs) {
//   const body = JSON.parse(await request.text());

//   const { blogFilePath, userId } = body;

//   // Get the path to the user's desktop
//   const desktopPath = path.join(os.homedir(), "Desktop");

//   // Combine the desktop path with the blogFilePath
//   const fullPath = path.join(desktopPath, blogFilePath);

//   // Read the file
//   let blogFileContents: string;
//   try {
//     blogFileContents = await fs.readFile(fullPath, "utf-8");
//   } catch (error) {
//     console.error(`Error reading file: ${fullPath}`, error);
//     throw new Error(`Unable to read blog file: ${blogFilePath}`);
//   }

//   const completion = await openai.beta.chat.completions.parse({
//     model: "gpt-4o",
//     messages: [{ role: "user", content: extractUserPrompt(blogFileContents) }],
//     temperature: 0,
//     max_tokens: 4096,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//     response_format: {
//       type: "json_object",
//       // json_schema: JSON.parse(LINKS_SCHEMA),
//     },
//   });

//   const extraction = completion.choices[0].message.content;

//   console.log("extraction", extraction);
//   const productUrls = JSON.parse(extraction || "{}")?.product_links;

//   const article = await prisma.article.create({
//     data: {
//       userId,
//       type: "ALTERNATIVE",
//       title: path.basename(blogFilePath), // Using the file name as title
//       blogFileContents,
//       products: {
//         create: productUrls.map((url: string, index: number) => ({
//           baseUrl: url,
//           position: index,
//         })),
//       },
//     },
//   });

//   console.log("productUrls", productUrls);

//   await startExtractionFlow(article.id);

//   const corsHeader =
//     process.env.NODE_ENV === "production"
//       ? {
//           "Access-Control-Allow-Origin": "*",
//         }
//       : {};
//   const headers = {
//     ...corsHeader,
//     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type",
//   } as HeadersInit;

//   return json({}, { headers });
// }
// const extractUserPrompt = (blogFileContents: string) =>
//   `I would like you to help me extract the specific product URLs for all the products listed in the following blog post. \n\nThis blog post is an \"alternatives\" list for a specific product. \n\nPlease follow these guidelines: \n1. Identify the main product that the alternatives are being compared to. \n2. Extract the official product URL for the main product. \n3. Identify all alternative products mentioned in the blog post. \n4. For each alternative product, extract its official product URL. This should be the URL that leads directly to the product's main page or homepage, not just the company's general website. \n5. If a product is part of a larger suite (like Google Sheets is part of Google Workspace), provide the URL that goes directly to that specific product's page. \n6. Compile all these URLs (including the main product's URL) into a string array. Please think through this process step by step, and if you're unsure about a URL, do not include it in the list. \n\nHere's the blog post content:\n\`\`\`${blogFileContents}\`\`\`\n\nPlease make sure that no product is overlooked. The main product's URL must be extracted and included in the final list.\n\nRespond in JSON:\n{\n\"product_links\": string[]\n}`;

// const LINKS_SCHEMA = JSON.stringify({
//   name: "product_links",
//   strict: true,
//   schema: {
//     type: "object",
//     properties: {
//       product_links: {
//         type: "array",
//         items: {
//           type: "string",
//         },
//         additionalProperties: false,
//       },
//     },
//     required: ["product_links"],
//     additionalProperties: false,
//   },
// });
