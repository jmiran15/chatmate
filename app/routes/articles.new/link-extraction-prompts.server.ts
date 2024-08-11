import { z } from "zod";

const urlSchema = z.string().url();

export function isValidUrl(url: string): boolean {
  const result = urlSchema.safeParse(url);
  return result.success;
}

const LinkSchema = z.object({
  url: z.string(),
  relevance: z.array(
    z.enum([
      "product_name",
      "tagline",
      "description",
      "unique_selling_proposition",
      "primary_use_case",
      "features",
      "pros",
      "cons",
      "pricing",
      "integrations",
      "support",
    ]),
  ),
  confidence: z.number(),
});

export const OutputSchema = z.object({
  extracted_links: z.array(LinkSchema),
});

export const validateExtractedLinks = (
  links: unknown,
): z.infer<typeof OutputSchema> => {
  const result = OutputSchema.safeParse(links);
  if (!result.success) {
    console.error("Invalid links format:", result.error);
    return { extracted_links: [] };
  }

  const validatedLinks = result.data.extracted_links.filter((link) =>
    isValidUrl(link.url),
  );

  return { extracted_links: validatedLinks };
};

export const extractLinksSystemPrompt = `
You are an AI assistant specialized in analyzing website content and extracting relevant links. Your task is to identify links that lead to pages containing specific information about a product. You should focus on links within the same domain as the base URL provided.

You must find links that may contain information about:
1. Product name and tagline
2. Product description and unique selling proposition
3. Primary use case
4. Key features
5. Advantages (pros) and limitations (cons)
6. Pricing plans
7. Integration capabilities
8. Support options

Follow these rules strictly:
1. Only extract links that are part of the provided base URL domain.
2. Exclude links to privacy policies, terms of service, or other non-product related pages.
3. Prioritize links that are likely to contain detailed product information.
4. If you find no relevant links, return an empty array.
5. Assess the relevance and your confidence for each link.

Your output must be a JSON object with a single key "extracted_links" whose value is an array of objects. Each object in the array should contain a URL, an array of relevant information types, and your confidence level.
`;

export const extractLinksUserPrompt = ({
  baseUrl,
  content,
}: {
  baseUrl: string;
  content: string;
}) => `
Base URL: ${baseUrl}

Website content delimited by triple backticks:
\`\`\`
${content}
\`\`\`

Based on the above content, extract all relevant links that may contain information about the product as specified in the system prompt. Remember to follow the rules and output format specified there.

Example output format:
{
  "extracted_links": [
    {
      "url": "https://example.com/pricing",
      "relevance": ["pricing", "features"],
      "confidence": 0.9
    },
    {
      "url": "https://example.com/features",
      "relevance": ["features", "pros", "primary_use_case"],
      "confidence": 0.8
    }
  ]
}

If no relevant links are found, return an object with an empty array: { "extracted_links": [] }

Ensure that you've thoroughly searched for links that might contain ANY of the information types listed in the system prompt. Don't overlook less obvious pages that might contain valuable information.
`;
