import { ScrapedWebsite } from "./actions.server";

// TODO - split these up into system and user prompts

export const extractInfoUserPrompt = ({
  websites,
}: {
  websites: ScrapedWebsite[];
}) => `You are an AI assistant specialized in extracting comprehensive and accurate product information from website content. Your primary goal is to gather all relevant details without missing any crucial information. Follow these steps meticulously:
  
  1. Carefully analyze the content from each provided website. Pay close attention to all sections, including headers, subheaders, bullet points, and any emphasized text.
  
  2. Extract relevant information for the following categories:
     - Product name (be as specific as possible, including any version numbers if applicable)
     - Tagline (the main slogan or catchphrase used to describe the product)
     - Short description (a concise overview of what the product does)
     - Unique selling proposition (what sets this product apart from competitors)
     - Primary use case (the main problem this product solves or its primary function)
     - Key features (important capabilities or aspects of the product)
     - Pros (advantages or benefits of using the product)
     - Cons (limitations, drawbacks, or potential issues with the product)
     - Pricing plans (all available pricing tiers and what they include)
     - Integrations (other tools or services this product can work with)
     - Support options (ways users can get help or assistance)
  
  3. Use verbatim quotes from the provided content. Do not summarize, paraphrase, or infer information not explicitly stated.
  
  4. Include the exact source URL for each piece of extracted information. If a piece of information appears on multiple pages, include all relevant URLs.
  
  5. Be thorough: look for information in all parts of the website content, including navigation menus, footers, and any linked pages provided.
  
  6. If you cannot find information for a category, explicitly state "No information found" for that category.
  
  7. If you find conflicting information, include all versions and note the conflict.
  
  The website content is delimited by triple backticks and prefixed with its source URL:
  
  ${websites
    .map(
      (website) => `Source URL: ${website.url}
  \`\`\`
  ${website.content}
  \`\`\``,
    )
    .join("\n\n")}
  
  Provide your output as a JSON object.
  
  Be as comprehensive as possible in your extraction.`;

export const combineExtractedInfoUserPrompt = ({
  result1,
  result2,
}: {
  result1: string;
  result2: string;
}) => `You are an AI assistant tasked with combining and refining extracted product information. Your goal is to create a comprehensive, non-redundant, and accurate compilation of product details. Follow these steps meticulously:
  
  1. Carefully analyze the two sets of extracted product information provided below.
  2. Combine the information from both sets, ensuring no unique details are lost in the process.
  3. Remove exact duplicates, but retain information that is similar but provides additional context or detail.
  4. If there are conflicting pieces of information:
     a. Include both pieces of information.
     b. Add a note highlighting the conflict.
     c. If one source seems more authoritative (e.g., from the product's official features page rather than a blog post), prioritize it but still include the other.
  5. Ensure that all sources are preserved and accurately linked to their respective pieces of information. If a piece of information appears in both sets, include both sources.
  6. Maintain the structure of the input data in your output.
  7. For each category, order the information from most to least important or comprehensive.
  
  The two sets of extracted information are delimited by triple backticks:
  
  Set 1:
  \`\`\`
  ${result1}
  \`\`\`
  
  Set 2:
  \`\`\`
  ${result2}
  \`\`\`
  
  Provide your output as a single JSON object that combines and refines the information from both sets.
  
  Ensure your output is comprehensive, non-redundant, accurately sourced, and retains all unique and valuable information from both input sets. If you're unsure about how to handle a specific piece of information, include it and add a note explaining your uncertainty.`;
