// TODO: integrate Helicone sessions and prompts
import { createId } from "@paralleldrive/cuid2";
import { type Chatbot, type Embedding } from "@prisma/client";
import { V2RerankResponse } from "cohere-ai/api";
import uniqWith from "lodash/uniqWith";
import { ChatCompletionTool } from "openai/resources/index.mjs";
import pLimit from "p-limit";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { generateHyDE } from "./ai/inference/HyDE";
import { generateSimilarUserQueries } from "./ai/inference/augmentQuery.server";
import { generateSubQuestions } from "./ai/inference/subquestions.server";
import {
  mainChatSystemPrompt_v3,
  mainChatUserPrompt_v3,
  mainTools,
} from "./prompts";
import { cohere, openai } from "./providers.server";

export const CHUNK_SIZE = 1024;
export const OVERLAP = 20;
export const RERANK_MODEL:
  | "rerank-english-v3.0"
  | "rerank-multilingual-v3.0"
  | "rerank-english-v2.0"
  | "rerank-multilingual-v2.0" = "rerank-english-v3.0";

export async function embed({
  input,
  sessionId,
  sessionPath,
  sessionName,
}: {
  input: string | string[];
  sessionId?: string;
  sessionPath?: string;
  sessionName?: string;
}): Promise<number[] | number[][]> {
  try {
    const embedding = await openai.embeddings.create(
      {
        model: "text-embedding-3-small",
        input: Array.isArray(input)
          ? input.map((i) => i.replace(/\n/g, " "))
          : input.replace(/\n/g, " "),
        encoding_format: "float",
      },
      {
        headers: {
          "Helicone-Property-Environment": process.env.NODE_ENV,
          ...(sessionId &&
            sessionPath &&
            sessionName && {
              "Helicone-Session-Id": sessionId,
              "Helicone-Session-Path": sessionPath,
              "Helicone-Session-Name": sessionName,
            }),
        },
      },
    );

    return Array.isArray(input)
      ? embedding.data.map((e) => e.embedding as number[])
      : (embedding.data[0].embedding as number[]);
  } catch (e) {
    throw new Error(`Error calling OpenAI embedding API: ${e}`);
  }
}

const limit = pLimit(100); // Adjust this number based on your server's capacity

async function searchEmbeddings({
  chatbotId,
  queries,
  tagLimit = 10,
  regularLimit = 5,
  minSimilarity = 0.7,
  sessionId,
  sessionPath,
  sessionName,
}: {
  chatbotId: string;
  queries: string[];
  tagLimit?: number;
  regularLimit?: number;
  minSimilarity?: number;
  sessionId: string;
  sessionPath: string;
  sessionName: string;
}): Promise<EmbeddingWithDistance[]> {
  // Batch embed all queries
  const embeddings = await batchEmbed(
    queries,
    sessionId,
    sessionPath,
    sessionName,
  );

  const searchTasks = embeddings.flatMap((embedding, index) => [
    limit(() =>
      fetchRelevantEmbeddingsWithVector({
        chatbotId,
        embedding,
        k: tagLimit,
        isQA: true,
        minSimilarity,
      }),
    ),
    limit(() =>
      fetchRelevantEmbeddingsWithVector({
        chatbotId,
        embedding,
        k: regularLimit,
        isQA: false,
        minSimilarity,
      }),
    ),
  ]);

  const results = await Promise.all(searchTasks);

  const allResults = results
    .flat()
    .filter((result): result is EmbeddingWithDistance => result !== null);

  console.log("allResults: ", allResults);

  // Replace the existing uniqBy call with uniqWith
  return uniqWith(
    allResults,
    (a, b) => a.documentId === b.documentId && a.content === b.content,
  );
}

export async function chat({
  chatbot,
  messages,
  extraTools,
  sessionId,
  chatName,
}: {
  chatbot: Chatbot;
  messages: { role: "user" | "assistant"; content: string }[];
  extraTools?: ChatCompletionTool[];
  sessionId: string;
  chatName: string;
}) {
  invariant(messages.length > 0, "Messages must not be empty");
  invariant(
    messages[messages.length - 1].role === "user",
    "Last message must be from the user",
  );

  const query = messages[messages.length - 1].content;

  let rerankedEmbeddings: V2RerankResponse | null = null;
  let skipProcessing = false;

  // see if this matches any of the exact type document matchTypes in the DB
  const hasExactMatch = await prisma.document.findFirst({
    where: {
      chatbotId: chatbot.id,
      question: {
        search: query.trim().replace(/\s+/g, " & "),
      },
      matchType: "EXACT",
    },
  });

  if (hasExactMatch) {
    const staticResponse = hasExactMatch.responseType === "STATIC";

    if (staticResponse) {
      return new ReadableStream({
        start(controller) {
          const content = hasExactMatch.content as string;

          const id = createId();

          const chunk = {
            id,
            object: "chat.completion.chunk",
            created: Date.now(),
            model: "gpt-4o-2024-08-06",
            choices: [
              {
                index: 0,
                delta: { content, role: "assistant" },
                logprobs: null,
                finish_reason: null,
              },
            ],
          };
          controller.enqueue(chunk);

          controller.close();
        },
      });
    } else {
      rerankedEmbeddings = {
        results: [
          {
            document: {
              text: hasExactMatch.content as string,
            },
            index: 0,
            relevanceScore: 1,
          },
        ],
      };
      skipProcessing = true;
    }
  }

  if (!skipProcessing) {
    // TODO: "pre-selection stage" - for improving the speed of messages that don't require much RAG (or none at all).
    // before all of this ... we should do a pre-selection stage where a super fast llm decides the "RAG path" to be taken. e.g, if the user just says "hi" ... no need to RAG, just use the base prompt.
    // if the user says something super complicated ... etc... then decide to call more stuff!
    // all of these can run in parallel - and each is essentially one request to the LLM, so the time is based on the slowest one.
    // ^^^ we can maybe do this with Groq???
    // PROBABLY JUST A "SKIP" RAG step would be best here. Skipping anything else would not really save much time.

    // TODO: Decide on the RAG path

    // ## Preprocessing stage
    const [similarQueriesResult, subQuestionsResult, hydeResult] =
      await Promise.allSettled([
        generateSimilarUserQueries({
          originalQuery: query,
          sessionId,
          chatName,
        }),
        generateSubQuestions({
          originalQuery: query,
          sessionId,
          chatName,
        }),
        generateHyDE({
          originalQuery: query,
          sessionId,
          chatName,
        }),
      ]);

    const similarQueries =
      similarQueriesResult.status === "fulfilled"
        ? similarQueriesResult.value
        : null;
    const subQuestions =
      subQuestionsResult.status === "fulfilled"
        ? subQuestionsResult.value
        : null;
    const hyde = hydeResult.status === "fulfilled" ? hydeResult.value : null;

    // Log errors if any
    if (similarQueriesResult.status === "rejected") {
      console.error(
        "Failed to generate similar queries:",
        similarQueriesResult.reason,
      );
    }
    if (subQuestionsResult.status === "rejected") {
      console.error(
        "Failed to generate sub questions:",
        subQuestionsResult.reason,
      );
    }
    if (hydeResult.status === "rejected") {
      console.error("Failed to generate HyDE:", hydeResult.reason);
    }

    // TODO: generate some queries based on the query + history, we need this to embed the chat context into the retrieval.
    // TODO: include the previous used compressed chunks/context in the new context, before passing to the reranker.
    // Probably would be a good use of Redis.
    // i.e. we can keep all the previous questions, hyde, etc... everything we have generated in Redis, retrieve docs, and keep a running list
    // where we only append new docs... and the reranker should take care of getting rid of irrelevant stuff (i.e. old stuff that is irrelevant to the current query).

    // ## Retrieval stage
    const allQueries = [
      query,
      ...(similarQueries?.expandedQueries ?? []),
      ...(subQuestions?.subQuestions?.map(
        (subQuestion) => subQuestion.question,
      ) ?? []),
      hyde?.hypotheticalAnswer ?? "",
    ].filter(Boolean);

    const relevantEmbeddings = await searchEmbeddings({
      chatbotId: chatbot.id,
      queries: allQueries,
      tagLimit: 10,
      regularLimit: 10,
      minSimilarity: 0.6,
      sessionId,
      sessionPath: "/message/search_embeddings",
      sessionName: chatName,
    });

    // TODO: compress the chunks with LLMLingua2

    // TODO: in here we need to check if any of the highly ranked documents have responseType === "STATIC", if so, we can skip the generation step and just return the static response. (with the stream like above)
    if (relevantEmbeddings.length > 0) {
      // Rerank with Cohere Ranker 3
      rerankedEmbeddings = await rerank({
        query,
        documents: relevantEmbeddings.map((embedding) => ({
          id: embedding.id,
          text: embedding.content,
        })),
        topN: 10, // Probably increase this number... or perhaps we can make it a percentage of the total documents in a chatbot's embedding space, up-to some max. and would prob. be for it to be expontential to some point, and then drop off exponentially, almost like a sigmoid curve.
        model: RERANK_MODEL,
      });
    }
  }

  // create the prompts and call the final LLM
  const systemPrompt = mainChatSystemPrompt_v3({
    chatbotName: chatbot.name,
    systemPrompt: chatbot.systemPrompt
      ? chatbot.systemPrompt
      : "Your are a friendly chatbot here to help you with any questions you have.",
    responseLength: chatbot.responseLength
      ? (chatbot.responseLength as "short" | "medium" | "long")
      : "short",
    startWords:
      chatbot.responseLength === "short"
        ? "25"
        : chatbot.responseLength === "medium"
        ? "50"
        : "100",
    endWords:
      chatbot.responseLength === "short"
        ? "50"
        : chatbot.responseLength === "medium"
        ? "100"
        : "100+",
  });

  const userPrompt = mainChatUserPrompt_v3({
    retrievedData: rerankedEmbeddings
      ? rerankedEmbeddings.results
          .map(
            (reference) =>
              `Document relevance: ${reference.relevanceScore}\nDocument content: ${reference.document?.text}`,
          )
          .join("\n\n")
      : "",
    question: query,
  });

  messages[messages.length - 1].content = userPrompt;

  const enviroment = process.env.NODE_ENV;

  const stream = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      model: "gpt-4o",
      temperature: 0,
      stream: true,
      tools: [...mainTools, ...(extraTools ?? [])],
    },
    {
      headers: {
        "Helicone-Property-Environment": enviroment,
        "Helicone-Session-Id": sessionId, // the message id
        "Helicone-Session-Path": "/message", // /message
        "Helicone-Session-Name": chatName, // the chat name
      },
    },
  );

  return stream;
}

type EmbeddingWithDistance = Omit<Embedding, "embedding"> & {
  distance: number;
};

async function rerank({
  query,
  documents,
  topN,
  model,
}: {
  query: string;
  documents: { id: string; text: string }[];
  topN: number;
  model: typeof RERANK_MODEL;
}): Promise<V2RerankResponse> {
  return await cohere.v2.rerank({
    documents,
    query,
    topN,
    model,
    returnDocuments: true,
  });
}

const MAX_BATCH_SIZE = 100;

export async function batchEmbed(
  inputs: string[],
  sessionId: string,
  sessionPath: string,
  sessionName: string,
): Promise<number[][]> {
  const batches = [];
  for (let i = 0; i < inputs.length; i += MAX_BATCH_SIZE) {
    batches.push(inputs.slice(i, i + MAX_BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map((batch) =>
      embed({ input: batch, sessionId, sessionPath, sessionName }),
    ),
  );
  return results.flat() as number[][];
}

async function fetchRelevantEmbeddingsWithVector({
  chatbotId,
  embedding,
  k = 5,
  isQA = false,
  minSimilarity = 0.7,
}: {
  chatbotId: string;
  embedding: number[];
  k?: number;
  isQA?: boolean;
  minSimilarity?: number;
}): Promise<EmbeddingWithDistance[] | null> {
  try {
    const results = await prisma.$queryRaw<EmbeddingWithDistance[]>`
      SELECT DISTINCT ON (e.content)
        e.id,
        e."createdAt",
        e."documentId",
        e."chatbotId",
        e.content,
        e."isQA",
        1 - (e.embedding <=> ${embedding}::vector) AS distance
      FROM "Embedding" e
      JOIN "Document" d ON e."documentId" = d.id
      WHERE e."chatbotId" = ${chatbotId}
        AND e."isQA" = ${isQA}
        AND d."isPending" = false
        AND d."matchType" != 'EXACT'
        AND 1 - (e.embedding <=> ${embedding}::vector) > ${minSimilarity}
      ORDER BY e.content, distance DESC
      LIMIT ${k};
    `;

    console.log("results: ", results);

    return results.length > 0 ? results : null;
  } catch (error) {
    console.log("error: ", error);
    console.error("Error fetching relevant embeddings:", error);
    return null;
  }
}
