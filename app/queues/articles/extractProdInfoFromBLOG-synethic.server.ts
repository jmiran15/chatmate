// this will get the scraped contents of the blog post as its child
// then it will extract the prod info from the blog post
// this will ensure that we only extract the info in the blog and not something different
// use the same prompt and json schema

import { Queue } from "~/utils/queue.server";
import { anthropic, openai } from "~/utils/providers.server";

import { logAPICall } from "~/routes/articles.new/logging.server";
import { Tiktoken } from "tiktoken/lite";
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
import { LLMS } from "~/routes/articles.new/actions.server";
import { prisma } from "~/db.server";
import { ScrapedWebsite } from "~/routes/articles.new/actions.server";
import { combineExtractedInfoUserPrompt } from "~/routes/articles.new/extraction-prompts.server";

export const CLAUDE_BLOG_EXPORT_USER = ({
  JSON_SCHEMA,
  SOURCE_URL,
  SOURCE_DATA,
  SOURCE,
}: {
  JSON_SCHEMA: string;
  SOURCE_URL: string;
  SOURCE_DATA: string;
  SOURCE: string;
}) =>
  `You are an AI assistant specialized in extracting comprehensive and accurate product information about a single specific product from an “alternatives” list blog post. Your primary goal is to gather all relevant details without missing crucial information. Follow these steps meticulously:1. Carefully analyze the content from the provided blog post.2. Extract relevant information for the following categories:- Product name (be as specific as possible, including any version numbers if applicable)- Tagline (the main slogan or catchphrase used to describe the product)- Short description (a concise overview of what the product does)- Unique selling proposition (what sets this product apart from competitors)- Primary use case (the main problem this product solves or its primary function)- Key features (important capabilities or aspects of the product)- Pros (advantages or benefits of using the product)- Cons (limitations, drawbacks, or potential issues with the product)- Pricing plans (all available pricing tiers and what they include)- Integrations (other tools or services this product can work with)- Support options (ways users can get help or assistance)\n3. Use verbatim quotes from the provided content. Do not summarize, paraphrase, or infer information not explicitly stated.4. Include the exact source URL for each piece of extracted information.5. Be thorough.6. If you cannot find information for a category, explicitly state \"No information found\" for that category.7. If you find conflicting information, include all versions and note the conflict.\n\nYou must follow the following JSON schema in your response. Respond with the JSON object that matches this JSON schema. \n${JSON_SCHEMA}The website content is delimited by triple backticks and prefixed with its source URL:Source URL: ${SOURCE_URL}\`\`\`\n${SOURCE_DATA}\n\`\`\`\n\nProvide your output as a JSON object.Be as comprehensive as possible in your extraction.Please note that the provided scraped information is from an \"alternatives\" list blog post that contains information about MULTIPLE SIMILAR products. You will only be focused on extracting the JSON schema for the product: \"${SOURCE}\". You MUST ignore any information in the blog post that is irrelevant to this product. ALSO - you will notice that the JSON schema requires you to provide a source path for your text. Your source paths MUST ALWAYS COME FROM THE ROOT URL \"${SOURCE}\". If the specific path where the text comes from is not available in the blog post, use \" \"${SOURCE}\" as the source. Remember to look EVERYWHERE in the provided blog post for information about the specific product. There could be information regarding this product in any part of the blog post, so you must analyze the entire blog post. You must include absolutely everything in the blog post about this product. NOTHING CAN BE LEFT OUT.`;

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

export const extractfromblog = Queue<ExtractProductInfoJob>(
  "extractfromblog",
  async (job) => {
    const { productId } = job.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        article: true,
      },
    });

    const article = product?.article;

    const website: { url: string; content: string } = {
      url: article?.title!,
      content: article?.blogFileContents!,
    };

    const websites: ScrapedWebsite[] = [website];

    if (!product || !article) {
      throw new Error(`Product with id ${productId} not found`);
    }

    await initEncoder();

    async function extractBatch(websites: ScrapedWebsite[]): Promise<string> {
      const estimatedTokens = estimateTokenCount(
        `The product we need to extract information for is \"${product?.baseUrl}\".\n\nThe entire blog post is delimited by triple backticks. Please analyze it carefully and extract all relevant chunks about ${product?.baseUrl}, following the instructions provided in the system prompt.\n\n\`\`\`\n${websites[0].content}\n\`\`\`\nRemember to output your findings in the specified JSON format. If you find no relevant information about ${product?.baseUrl}, return an empty list for "extracted_chunks".`,
      );

      if (estimatedTokens > MAX_TOKENS) {
        return await splitAndExtract(websites);
      }

      try {
        const completion1 = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'You are an AI assistant specialized in extracting relevant information about specific products from "alternatives list" style blog posts. These blog posts typically contain sections detailing alternative products to a root product. Your task is to extract exact chunks of text that contain important assertions about a specified product.\n\nFollow these steps:\n\n1. Carefully read through the entire blog post.\n2. Identify sections or paragraphs that contain substantial information about the specified product.\n3. Extract these sections exactly as they appear, without paraphrasing or summarizing.\n4. Include any relevant information that may be scattered throughout the post, not just from a single section.\n5. Focus on important details such as:\n   - Product features\n   - Pricing information\n   - Unique selling points\n   - Comparisons to other products (only if they provide insight into the specified product)\n   - User reviews or testimonials\n6. Do not include sections that only mention the product in passing or compare it briefly to another product.\n7. If the blog post is very long, make sure to analyze it in its entirety, as relevant information may be spread out.\n\nOutput your findings in the following format:\n```json\n{\n  "product_name": "Name of the specified product",\n  "extracted_chunks": [\n    {\n      "chunk_number": 1,\n      "content": "Exact text from the blog post"\n    },\n    {\n      "chunk_number": 2,\n      "content": "Exact text from the blog post"\n    }\n    // ... additional chunks as needed\n  ]\n}\n```',
            },
            {
              role: "user",
              content: `The product we need to extract information for is \"${product?.baseUrl}\".\n\nThe entire blog post is delimited by triple backticks. Please analyze it carefully and extract all relevant chunks about ${product?.baseUrl}, following the instructions provided in the system prompt.\n\n\`\`\`\n${websites[0].content}\n\`\`\`\nRemember to output your findings in the specified JSON format. If you find no relevant information about ${product?.baseUrl}, return an empty list for "extracted_chunks".`,
            },
          ],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: {
            type: "json_schema",
            json_schema: JSON.parse(CHUNKS_SCHM),
          },
        });

        const CHUNKS = JSON.parse(completion1.choices[0].message?.content!);

        const completion2 = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant specialized in extracting precise product information from provided content. Your task is to analyze the given text and extract information according to a specific JSON schema. Follow these instructions carefully:\n\n1. Analyze the provided content thoroughly. This content consists of extracted chunks from various pages of a product's website.\n\n2. Extract information for all fields specified in the JSON schema. Use verbatim quotes from the provided content. Do not summarize, paraphrase, or infer information not explicitly stated.\n\n3. For each piece of extracted information, include the exact source URL. If a specific URL is mentioned in the chunk, use that. Otherwise, use the base URL provided in the user message.\n\n4. If you cannot find information for a field, set its value to null. Do not use \"No information found\" or similar phrases.\n\n5. If you find conflicting information, include all versions and note the conflict in the relevant field.\n\n6. Ignore any information irrelevant to the specified product.\n\n7. Use only the information provided in the input chunks. Do not use any external knowledge about the product.\n\n8. Pay attention to the requirements for each field in the JSON schema, such as word limits or the number of items in arrays.\n\n9. For the extractionConfidence field, provide an overall confidence score between 0 and 1, and list any fields for which information couldn't be confidently extracted.\n\nYour response must strictly adhere to the provided JSON schema. Accuracy and comprehensiveness are crucial.",
            },
            {
              role: "user",
              content: `Extract comprehensive information about ${product?.baseUrl} based on the provided content. The base URL for ${product?.baseUrl} is \"${product?.baseUrl}\".\n\nThe content below consists of chunks extracted from various pages of ${product?.baseUrl}'s website. Each chunk is numbered and contains exact text from the website. Analyze all chunks thoroughly as they may contain relevant information about ${product?.baseUrl}.\n\nUse only the information provided in these chunks. Do not use any external knowledge about ${product?.baseUrl}.\n\nHere are the extracted chunks:\n\n\`\`\`json\n${JSON.stringify(
                CHUNKS,
              )}\n\`\`\`\n\nProvide your response in the JSON format specified by the schema. Ensure all required fields are filled, using null for any fields where information is not found in the provided chunks.`,
            },
          ],
          temperature: 0,
          max_tokens: 16383,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: {
            type: "json_schema",
            json_schema: JSON.parse(SCHM),
          },
        });

        const response = JSON.parse(completion2.choices[0].message?.content!);

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

    return { extractedProductInfo: JSON.stringify(result) };
  },
);

const SCHM = JSON.stringify({
  name: "extraction_response",
  strict: true,
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
            description: "The product's tagline or slogan (max 20 words)",
          },
          source: {
            type: "string",
            description: "The URL of the page where this tagline was found",
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
          },
          source: {
            type: "string",
            description: "The URL of the page where this description was found",
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
          },
          source: {
            type: "string",
            description: "The URL of the page where this USP was found",
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
          },
          source: {
            type: "string",
            description: "The URL of the page where this information was found",
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
              description: "A key feature of the product (max 10 words)",
            },
            description: {
              type: "string",
              description: "A brief description of the feature (max 30 words)",
            },
            source: {
              type: "string",
              description: "The URL of the page where this feature was found",
            },
          },
          required: ["feature", "description", "source"],
          additionalProperties: false,
        },
        description: "An array of the product's key features (3-7 features)",
      },
      pros: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pro: {
              type: "string",
              description: "A specific advantage of the product (max 15 words)",
            },
            source: {
              type: "string",
              description: "The URL of the page where this advantage was found",
            },
          },
          required: ["pro", "source"],
          additionalProperties: false,
        },
        description: "An array of the product's advantages (3-5 pros)",
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
            },
            source: {
              type: "string",
              description:
                "The URL of the page where this disadvantage was found",
            },
          },
          required: ["con", "source"],
          additionalProperties: false,
        },
        description:
          "An array of the product's disadvantages or limitations (2-4 cons)",
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
            },
            features: {
              type: "array",
              items: {
                type: "string",
                description:
                  "A key feature included in this pricing plan (max 10 words)",
              },
              description:
                "An array of key features included in this pricing plan (3-5 features)",
            },
            source: {
              type: "string",
              description:
                "The URL of the page where this pricing information was found",
            },
          },
          required: ["planName", "price", "features", "source"],
          additionalProperties: false,
        },
        description: "An array of the product's pricing plans (1-4 plans)",
      },
      integrations: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "A brief description of the product's integration capabilities (1-2 sentences)",
          },
          examples: {
            type: "array",
            items: {
              type: "string",
              description: "Name of a specific integration",
            },
            description: "Examples of specific integrations (up to 5)",
          },
          source: {
            type: "string",
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
        description: "An array of support options offered by the product",
      },
      extractionConfidence: {
        type: "object",
        properties: {
          overall: {
            type: "number",
            description: "Overall confidence in the extraction (0-1)",
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
});

const CHUNKS_SCHM = JSON.stringify({
  name: "extract_chunks",
  strict: true,
  schema: {
    type: "object",
    required: ["product_name", "extracted_chunks"],
    properties: {
      product_name: {
        type: "string",
        description: "The name of the specified product",
      },
      extracted_chunks: {
        type: "array",
        items: {
          type: "object",
          required: ["chunk_number", "content"],
          properties: {
            content: {
              type: "string",
              description: "The exact text extracted from the blog post",
            },
            chunk_number: {
              type: "integer",
              description: "The sequential number of the extracted chunk",
            },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
});
