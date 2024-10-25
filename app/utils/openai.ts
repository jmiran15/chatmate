// TODO: integrate Helicone sessions and prompts
import { createId } from "@paralleldrive/cuid2";
import { ResponseType, type Chatbot, type Embedding } from "@prisma/client";
import { V2RerankResponse } from "cohere-ai/api";
import uniqWith from "lodash/uniqWith";
import { ChatCompletionTool } from "openai/resources/index.mjs";
import pLimit from "p-limit";
import { performance } from "perf_hooks";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { generateSimilarUserQueries } from "./ai/inference/augmentQuery.server";
import { generateHyDE } from "./ai/inference/HyDE";
import { generateSubQuestions } from "./ai/inference/subquestions.server";
import {
  mainChatSystemPrompt_v3,
  mainChatUserPrompt_v3,
  mainTools,
} from "./prompts";
import { cohere, openai } from "./providers.server";

const DEBUG_TIMING = process.env.NODE_ENV === "development";

//llama-3.2-1b-preview
export const groqModel = "llama-3.2-90b-text-preview";

interface TimingResult {
  operation: string;
  duration: number;
}

async function timeOperation<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<[T, TimingResult]> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    return [result, { operation, duration: end - start }];
  } catch (error) {
    const end = performance.now();
    console.error(`Error in operation ${operation}:`, error);
    return [null as T, { operation, duration: end - start }];
  }
}

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
  console.time("Batch Embed");
  const embeddings = await batchEmbed(
    queries,
    sessionId,
    sessionPath,
    sessionName,
  );
  console.timeEnd("Batch Embed");

  const searchTasks = embeddings.flatMap((embedding) => [
    fetchRelevantEmbeddingsWithVector({
      chatbotId,
      embedding,
      k: tagLimit,
      isQA: true,
      minSimilarity,
    }),
    fetchRelevantEmbeddingsWithVector({
      chatbotId,
      embedding,
      k: regularLimit,
      isQA: false,
      minSimilarity,
    }),
  ]);

  console.time("Search");
  const results = await Promise.all(searchTasks);
  console.timeEnd("Search");

  const allResults = results
    .flat()
    .filter((result): result is EmbeddingWithDistance => result !== null);

  const uniqueResults = uniqWith(
    allResults,
    (a, b) => a.documentId === b.documentId && a.content === b.content,
  );

  return uniqueResults;
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
  const timings: TimingResult[] = [];
  const totalStart = performance.now();

  invariant(messages.length > 0, "Messages must not be empty");
  invariant(
    messages[messages.length - 1].role === "user",
    "Last message must be from the user",
  );

  const query = messages[messages.length - 1].content;

  let rerankedEmbeddings: V2RerankResponse | null = null;
  let relevantEmbeddings: EmbeddingWithDistance[] = [];
  let skipProcessing = false;

  // see if this matches any of the exact type document matchTypes in the DB
  const [hasExactMatch, exactMatchTiming] = await timeOperation(
    "Exact Match Check",
    () =>
      prisma.document.findFirst({
        where: {
          chatbotId: chatbot.id,
          question: {
            search: query.trim().replace(/\s+/g, " & "),
          },
          matchType: "EXACT",
        },
      }),
  );
  timings.push(exactMatchTiming);

  if (hasExactMatch) {
    const staticResponse = hasExactMatch.responseType === "STATIC";

    if (staticResponse) {
      return streamStaticResponse(hasExactMatch.content as string);
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
      relevantEmbeddings = [
        {
          id: hasExactMatch.id,
          content: hasExactMatch.content as string,
          // distance: 1,
          documentName: hasExactMatch.name,
          documentUrl: hasExactMatch.url ?? "",
          documentQuestion: hasExactMatch.question ?? "",
          createdAt: hasExactMatch.createdAt,
          documentId: hasExactMatch.id,
          chatbotId: chatbot.id,
          isQA: null,
          responseType: hasExactMatch.responseType,
        },
      ];
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
    // Preprocessing stage
    const [preprocessingResults, preprocessingTiming] = await timeOperation(
      "Preprocessing",
      async () => {
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

        return {
          similarQueries:
            similarQueriesResult.status === "fulfilled"
              ? similarQueriesResult.value
              : null,
          subQuestions:
            subQuestionsResult.status === "fulfilled"
              ? subQuestionsResult.value
              : null,
          hyde: hydeResult.status === "fulfilled" ? hydeResult.value : null,
        };
      },
    );
    timings.push(preprocessingTiming);

    const { similarQueries, subQuestions, hyde } = preprocessingResults;

    // Log errors if any
    if (similarQueries === null) {
      console.error("Failed to generate similar queries");
    }
    if (subQuestions === null) {
      console.error("Failed to generate sub questions");
    }
    if (hyde === null) {
      console.error("Failed to generate HyDE");
    }

    // TODO: generate some queries based on the query + history, we need this to embed the chat context into the retrieval.
    // TODO: include the previous used compressed chunks/context in the new context, before passing to the reranker.
    // Probably would be a good use of Redis.
    // i.e. we can keep all the previous questions, hyde, etc... everything we have generated in Redis, retrieve docs, and keep a running list
    // where we only append new docs... and the reranker should take care of getting rid of irrelevant stuff (i.e. old stuff that is irrelevant to the current query).

    // Retrieval stage
    const allQueries = [
      query,
      ...(similarQueries?.expandedQueries ?? []),
      ...(subQuestions?.subQuestions?.map(
        (subQuestion) => subQuestion.question,
      ) ?? []),
      hyde?.hypotheticalAnswer ?? "",
    ].filter(Boolean);

    console.log("allQueries: ", allQueries);

    const [searchResults, searchTiming] = await timeOperation(
      "Embedding Search",
      () =>
        searchEmbeddings({
          chatbotId: chatbot.id,
          queries: allQueries,
          tagLimit: 100,
          regularLimit: 100,
          // minSimilarity: 0.6,
          minSimilarity: 0,
          sessionId,
          sessionPath: "/message/search_embeddings",
          sessionName: chatName,
        }),
    );
    timings.push(searchTiming);
    relevantEmbeddings = searchResults;

    if (relevantEmbeddings.length > 0) {
      // Rerank with Cohere Ranker 3
      const [rerankResults, rerankTiming] = await timeOperation(
        "Reranking",
        () =>
          rerank({
            query,
            documents: relevantEmbeddings.map((embedding) => ({
              id: embedding.id,
              text: embedding.content,
            })),
            topN: 10, // TODO - Probably increase this number... or perhaps we can make it a percentage of the total documents in a chatbot's embedding space, up-to some max. and would prob. be for it to be expontential to some point, and then drop off exponentially, almost like a sigmoid curve.
            model: RERANK_MODEL,
          }),
      );
      timings.push(rerankTiming);
      rerankedEmbeddings = rerankResults;
    }

    // TODO: in here we need to check if any of the highly ranked documents have responseType === "STATIC", if so, we can skip the generation step and just return the static response. (with the stream like above)
    if (rerankedEmbeddings) {
      const staticResponse = findMostRelevantStaticResponse(
        rerankedEmbeddings,
        relevantEmbeddings,
        3,
      );
      if (staticResponse) {
        return streamStaticResponse(staticResponse.content);
      }
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

  let augmentedContext: AugmentedContext[] = [];

  if (rerankedEmbeddings) {
    augmentedContext = augmentRerankedEmbeddings(
      rerankedEmbeddings,
      relevantEmbeddings,
    );
  }

  const userPrompt = mainChatUserPrompt_v3({
    retrievedData: augmentedContext
      .map((context) => {
        let documentInfo = "";
        if (context.documentName || context.documentQuestion) {
          documentInfo += `Document name: ${
            context.documentName || context.documentQuestion
          }\n`;
        }
        if (context.documentUrl) {
          documentInfo += `Document url: ${context.documentUrl}\n`;
        }
        documentInfo += `Document relevance score: ${context.relevanceScore}\n`;
        documentInfo += `Document content: ${context.text}`;
        return documentInfo;
      })
      .join("\n\n"),
    question: query,
  });

  messages[messages.length - 1].content = userPrompt;

  const [stream, streamTiming] = await timeOperation(
    "LLM Stream Creation",
    () =>
      openai.chat.completions.create(
        {
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          model: "gpt-4o",
          temperature: 0,
          stream: true,
          tools: [...mainTools, ...(extraTools ?? [])],
        },
        {
          headers: {
            "Helicone-Property-Environment": process.env.NODE_ENV,
            "Helicone-Session-Id": sessionId,
            "Helicone-Session-Path": "/message",
            "Helicone-Session-Name": chatName,
          },
        },
      ),
  );
  timings.push(streamTiming);

  const totalEnd = performance.now();
  const totalDuration = totalEnd - totalStart;

  if (DEBUG_TIMING) {
    console.log("Chat Function Timing Results:");
    timings.forEach(({ operation, duration }) => {
      console.log(`  ${operation}: ${duration.toFixed(2)}ms`);
    });
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
  }

  return stream;
}

type EmbeddingWithDistance = Omit<Embedding, "embedding"> & {
  // distance: number;
  documentName: string;
  documentUrl: string;
  documentQuestion: string;
  responseType: ResponseType;
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
  const reranked = await cohere.v2.rerank({
    documents,
    query,
    topN,
    model,
    returnDocuments: true,
  });

  return reranked;
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

  const key = `batchEmbed:${inputs.length}`;
  console.time(key);

  // TODO: batch this so it doesn't crash
  const results = await embed({
    input: inputs,
    sessionId,
    sessionPath,
    sessionName,
  });

  // const results = await Promise.all(
  //   batches.map((batch) =>
  //     embed({ input: batch, sessionId, sessionPath, sessionName }),
  //   ),
  // );

  console.timeEnd(key);

  return results as number[][];
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
    const key = `fetchEmbeddings:${createId()}`;
    console.time(key);
    const results = await prisma.$queryRaw<EmbeddingWithDistance[]>`
      SELECT
        e.id,
        e."createdAt",
        e."documentId",
        e."chatbotId",
        e.content,
        e."isQA",
        COALESCE(d.name, '') as "documentName",
        COALESCE(d.url, '') as "documentUrl",
        COALESCE(d.question, '') as "documentQuestion",
        COALESCE(d."responseType", 'GENERATIVE') as "responseType"
      FROM "Embedding" e
      JOIN "Document" d ON e."documentId" = d.id
      WHERE e."chatbotId" = ${chatbotId}
        AND e."isQA" = ${isQA}
        AND d."isPending" = false
        AND d."matchType" != 'EXACT'
      ORDER BY e.embedding <=> ${embedding}::vector(1536)
      LIMIT ${k};
    `;

    console.timeEnd(key);

    return results.length > 0 ? results : null;
  } catch (error) {
    console.log("error: ", error);
    console.error("Error fetching relevant embeddings:", error);
    return null;
  }
}

function streamStaticResponse(content: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
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
}

function findMostRelevantStaticResponse(
  rerankedEmbeddings: V2RerankResponse,
  relevantEmbeddings: EmbeddingWithDistance[],
  topN: number = 1,
): {
  content: string;
  relevanceScore: number;
} | null {
  console.log("topN: ", topN);
  for (let i = 0; i < Math.min(topN, rerankedEmbeddings.results.length); i++) {
    const result = rerankedEmbeddings.results[i];
    const relevantEmbedding = relevantEmbeddings[result.index];

    if (
      result.document &&
      relevantEmbedding?.responseType === ResponseType.STATIC
    ) {
      return {
        content: result.document.text,
        relevanceScore: result.relevanceScore,
      };
    }
  }

  return null;
}

type AugmentedContext = {
  id: string;
  relevanceScore: number;
  index: number;
  text: string;
  documentName: string;
  documentUrl: string;
  documentQuestion: string;
};

function augmentRerankedEmbeddings(
  rerankedEmbeddings: V2RerankResponse,
  relevantEmbeddings: EmbeddingWithDistance[],
): AugmentedContext[] {
  return rerankedEmbeddings.results.map((result) => {
    const relevantEmbedding = relevantEmbeddings[result.index];
    return {
      id: relevantEmbedding.id,
      relevanceScore: result.relevanceScore,
      index: result.index,
      text: result.document?.text ?? "",
      documentName: relevantEmbedding.documentName,
      documentUrl: relevantEmbedding.documentUrl,
      documentQuestion: relevantEmbedding.documentQuestion,
    };
  });
}
