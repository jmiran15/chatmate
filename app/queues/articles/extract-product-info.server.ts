import { Queue } from "~/utils/queue.server";
import { openai } from "~/utils/providers.server";

import { logAPICall } from "~/routes/articles.new/logging.server";
import { Tiktoken } from "tiktoken/lite";
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
import { LLMS } from "~/routes/articles.new/actions.server";
import { prisma } from "~/db.server";
import { ScrapedWebsite } from "~/routes/articles.new/actions.server";
import {
  combineExtractedInfoUserPrompt,
  extractInfoUserPrompt,
} from "~/routes/articles.new/extraction-prompts.server";
import fs from "fs/promises";
import path from "path";
import { DateTime } from "luxon";

interface ExtractProductInfoJob {
  productId: string;
}
const MAX_TOKENS = 64000; // limit is 128k input, 16k output

let encoder: Tiktoken;

async function initEncoder() {
  if (!encoder) {
    encoder = new Tiktoken(
      cl100k_base.bpe_ranks,
      cl100k_base.special_tokens,
      cl100k_base.pat_str,
    );
  }
}

function estimateTokenCount(text: string): number {
  if (!encoder) {
    throw new Error("Encoder not initialized");
  }
  return encoder.encode(text).length;
}

interface ExtractionLogEntry {
  productId: string;
  productUrl: string;
  timestamp: string;
  extractedInfo: string;
}

async function logExtraction(entry: ExtractionLogEntry): Promise<void> {
  const timestamp = DateTime.now().toFormat("yyyy-MM-dd_HH-mm-ss");
  const filename = `${entry.productUrl.replace(
    /[^a-zA-Z0-9]/g,
    "_",
  )}_${timestamp}.log`;
  const logDir = path.join(process.cwd(), "logs", "extractions");

  try {
    await fs.mkdir(logDir, { recursive: true });

    const logContent = `
Product URL: ${entry.productUrl}
Timestamp: ${entry.timestamp}

Extracted Information:
${entry.extractedInfo}
`.trim();

    await fs.writeFile(path.join(logDir, filename), logContent);
    console.log(`📝 Extraction logged: ${filename}`);
  } catch (error) {
    console.error(`❌ ERROR LOGGING EXTRACTION:`, error);
  }
}

export const extractProductInfoQueue = Queue<ExtractProductInfoJob>(
  "extractProductInfo",
  async (job) => {
    const { productId } = job.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { scrapedWebsites: true },
    });

    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    const websites: ScrapedWebsite[] = product.scrapedWebsites.map(
      (website) => ({
        url: website.url,
        content: website.content || "",
      }),
    );
    await initEncoder();

    async function extractBatch(websites: ScrapedWebsite[]): Promise<string> {
      const prompt = extractInfoUserPrompt({
        websites,
      });
      const estimatedTokens = estimateTokenCount(prompt);

      if (estimatedTokens > MAX_TOKENS) {
        return await splitAndExtract(websites);
      }

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extraction_response",
              schema: {
                type: "object",
                properties: {
                  productName: {
                    type: "string",
                    description:
                      "The exact name of the product as it appears on the website",
                  },
                  tagline: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The product's tagline or slogan (max 20 words)",
                        //   maxLength: 150,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this tagline was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  shortDescription: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "A brief description of the product (2-3 sentences, max 50 words)",
                        //   maxLength: 400,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this description was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  uniqueSellingProposition: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The product's unique selling proposition or what sets it apart from competitors (1-2 sentences, max 30 words)",
                        //   maxLength: 250,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this USP was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  primaryUseCase: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The primary use case or target audience for the product (1-2 sentences)",
                        //   maxLength: 200,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this information was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  keyFeatures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        feature: {
                          type: "string",
                          description:
                            "A key feature of the product (max 10 words)",
                          // maxLength: 80,
                        },
                        description: {
                          type: "string",
                          description:
                            "A brief description of the feature (max 30 words)",
                          // maxLength: 250,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this feature was found",
                        },
                      },
                      required: ["feature", "description", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's key features (3-7 features)",
                    //   minItems: 3,
                    //   maxItems: 7,
                  },
                  pros: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pro: {
                          type: "string",
                          description:
                            "A specific advantage of the product (max 15 words)",
                          // maxLength: 120,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this advantage was found",
                        },
                      },
                      required: ["pro", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's advantages (3-5 pros)",
                    //   minItems: 3,
                    //   maxItems: 5,
                  },
                  cons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        con: {
                          type: "string",
                          description:
                            "A specific disadvantage or limitation of the product (max 15 words)",
                          // maxLength: 120,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this disadvantage was found",
                        },
                      },
                      required: ["con", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's disadvantages or limitations (2-4 cons)",
                    //   minItems: 2,
                    //   maxItems: 4,
                  },
                  pricing: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        planName: {
                          type: "string",
                          description: "The name of the pricing plan",
                        },
                        price: {
                          type: "string",
                          description:
                            "The price of the plan (including frequency if applicable)",
                          // pattern: "^\\$?\\d+(\\.\\d{2})?\\s*(/\\w+)?$",
                        },
                        features: {
                          type: "array",
                          items: {
                            type: "string",
                            description:
                              "A key feature included in this pricing plan (max 10 words)",
                            //   maxLength: 80,
                          },
                          description:
                            "An array of key features included in this pricing plan (3-5 features)",
                          // minItems: 3,
                          // maxItems: 5,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this pricing information was found",
                        },
                      },
                      required: ["planName", "price", "features", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's pricing plans (1-4 plans)",
                    //   minItems: 1,
                    //   maxItems: 4,
                  },
                  integrations: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "A brief description of the product's integration capabilities (1-2 sentences)",
                        //   maxLength: 200,
                      },
                      examples: {
                        type: "array",
                        items: {
                          type: "string",
                          description: "Name of a specific integration",
                        },
                        description:
                          "Examples of specific integrations (up to 5)",
                        //   maxItems: 5,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this integration information was found",
                      },
                    },
                    required: ["text", "examples", "source"],
                    additionalProperties: false,
                  },
                  supportOptions: {
                    type: "array",
                    items: {
                      type: "string",
                      description:
                        "A support option offered by the product (e.g., 'Email support', 'Live chat')",
                    },
                    description:
                      "An array of support options offered by the product",
                    //   maxItems: 5,
                  },
                  extractionConfidence: {
                    type: "object",
                    properties: {
                      overall: {
                        type: "number",
                        //   minimum: 0,
                        //   maximum: 1,
                        description:
                          "Overall confidence in the extraction (0-1)",
                      },
                      missingInfo: {
                        type: "array",
                        items: {
                          type: "string",
                          description:
                            "Field name for which information couldn't be confidently extracted",
                        },
                        description:
                          "Array of fields for which information couldn't be confidently extracted",
                      },
                    },
                    required: ["overall", "missingInfo"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "productName",
                  "tagline",
                  "shortDescription",
                  "uniqueSellingProposition",
                  "primaryUseCase",
                  "keyFeatures",
                  "pros",
                  "cons",
                  "pricing",
                  "integrations",
                  "supportOptions",
                  "extractionConfidence",
                ],
                additionalProperties: false,
              },
              strict: true,
            },
          },
        });

        const response = JSON.parse(completion.choices[0].message?.content!);

        await logAPICall({
          llm: LLMS.EXTRACT_PRODUCT_INFO,
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response,
        });

        return response;
      } catch (error) {
        console.error(`Error extracting product info:`, error);
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
      try {
        if (websites.length > 1) {
          const mid = Math.floor(websites.length / 2);
          const firstHalfResult = await extractBatch(websites.slice(0, mid));
          const secondHalfResult = await extractBatch(websites.slice(mid));
          return await combineResults(firstHalfResult, secondHalfResult);
        } else {
          const website = websites[0];
          const mid = Math.floor(website.content.length / 2);
          const firstHalfResult = await extractBatch([
            { content: website.content.slice(0, mid), url: website.url },
          ]);
          const secondHalfResult = await extractBatch([
            { content: website.content.slice(mid), url: website.url },
          ]);
          return await combineResults(
            JSON.stringify(firstHalfResult),
            JSON.stringify(secondHalfResult),
          );
        }
      } catch (error) {
        console.error(`ERROR SPLITTING AND EXTRACTING:`, error);
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
      const combinedPrompt = combineExtractedInfoUserPrompt({
        result1,
        result2,
      });

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: combinedPrompt }],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extraction_response",
              schema: {
                type: "object",
                properties: {
                  productName: {
                    type: "string",
                    description:
                      "The exact name of the product as it appears on the website",
                  },
                  tagline: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The product's tagline or slogan (max 20 words)",
                        //   maxLength: 150,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this tagline was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  shortDescription: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "A brief description of the product (2-3 sentences, max 50 words)",
                        //   maxLength: 400,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this description was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  uniqueSellingProposition: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The product's unique selling proposition or what sets it apart from competitors (1-2 sentences, max 30 words)",
                        //   maxLength: 250,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this USP was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  primaryUseCase: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "The primary use case or target audience for the product (1-2 sentences)",
                        //   maxLength: 200,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this information was found",
                      },
                    },
                    required: ["text", "source"],
                    additionalProperties: false,
                  },
                  keyFeatures: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        feature: {
                          type: "string",
                          description:
                            "A key feature of the product (max 10 words)",
                          // maxLength: 80,
                        },
                        description: {
                          type: "string",
                          description:
                            "A brief description of the feature (max 30 words)",
                          // maxLength: 250,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this feature was found",
                        },
                      },
                      required: ["feature", "description", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's key features (3-7 features)",
                    //   minItems: 3,
                    //   maxItems: 7,
                  },
                  pros: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pro: {
                          type: "string",
                          description:
                            "A specific advantage of the product (max 15 words)",
                          // maxLength: 120,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this advantage was found",
                        },
                      },
                      required: ["pro", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's advantages (3-5 pros)",
                    //   minItems: 3,
                    //   maxItems: 5,
                  },
                  cons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        con: {
                          type: "string",
                          description:
                            "A specific disadvantage or limitation of the product (max 15 words)",
                          // maxLength: 120,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this disadvantage was found",
                        },
                      },
                      required: ["con", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's disadvantages or limitations (2-4 cons)",
                    //   minItems: 2,
                    //   maxItems: 4,
                  },
                  pricing: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        planName: {
                          type: "string",
                          description: "The name of the pricing plan",
                        },
                        price: {
                          type: "string",
                          description:
                            "The price of the plan (including frequency if applicable)",
                          // pattern: "^\\$?\\d+(\\.\\d{2})?\\s*(/\\w+)?$",
                        },
                        features: {
                          type: "array",
                          items: {
                            type: "string",
                            description:
                              "A key feature included in this pricing plan (max 10 words)",
                            //   maxLength: 80,
                          },
                          description:
                            "An array of key features included in this pricing plan (3-5 features)",
                          // minItems: 3,
                          // maxItems: 5,
                        },
                        source: {
                          type: "string",
                          // format: "uri",
                          description:
                            "The URL of the page where this pricing information was found",
                        },
                      },
                      required: ["planName", "price", "features", "source"],
                      additionalProperties: false,
                    },
                    description:
                      "An array of the product's pricing plans (1-4 plans)",
                    //   minItems: 1,
                    //   maxItems: 4,
                  },
                  integrations: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description:
                          "A brief description of the product's integration capabilities (1-2 sentences)",
                        //   maxLength: 200,
                      },
                      examples: {
                        type: "array",
                        items: {
                          type: "string",
                          description: "Name of a specific integration",
                        },
                        description:
                          "Examples of specific integrations (up to 5)",
                        //   maxItems: 5,
                      },
                      source: {
                        type: "string",
                        //   format: "uri",
                        description:
                          "The URL of the page where this integration information was found",
                      },
                    },
                    required: ["text", "examples", "source"],
                    additionalProperties: false,
                  },
                  supportOptions: {
                    type: "array",
                    items: {
                      type: "string",
                      description:
                        "A support option offered by the product (e.g., 'Email support', 'Live chat')",
                    },
                    description:
                      "An array of support options offered by the product",
                    //   maxItems: 5,
                  },
                  extractionConfidence: {
                    type: "object",
                    properties: {
                      overall: {
                        type: "number",
                        //   minimum: 0,
                        //   maximum: 1,
                        description:
                          "Overall confidence in the extraction (0-1)",
                      },
                      missingInfo: {
                        type: "array",
                        items: {
                          type: "string",
                          description:
                            "Field name for which information couldn't be confidently extracted",
                        },
                        description:
                          "Array of fields for which information couldn't be confidently extracted",
                      },
                    },
                    required: ["overall", "missingInfo"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "productName",
                  "tagline",
                  "shortDescription",
                  "uniqueSellingProposition",
                  "primaryUseCase",
                  "keyFeatures",
                  "pros",
                  "cons",
                  "pricing",
                  "integrations",
                  "supportOptions",
                  "extractionConfidence",
                ],
                additionalProperties: false,
              },
              strict: true,
            },
          },
        });

        const response = JSON.parse(completion.choices[0].message?.content!);

        await logAPICall({
          llm: LLMS.COMBINE_RESULTS,
          timestamp: new Date().toISOString(),
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: combinedPrompt }],
          response,
        });

        return response;
      } catch (error) {
        console.error(`ERROR COMBINING RESULTS:`, error);
        throw new Error(
          `Failed to combine results: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    const result = await extractBatch(websites);
    await logExtraction({
      productId: productId,
      productUrl: product.baseUrl,
      timestamp: new Date().toISOString(),
      extractedInfo: JSON.stringify(result),
    });
    return { extractedProductInfo: JSON.stringify(result) };
  },
);
