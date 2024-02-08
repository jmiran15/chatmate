// import { NextResponse } from "next/server";
// import { getContext } from "@/utils/context";
// import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

// some function to get the context of a query ---- we have the parallel to this function in openai helper file
// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();
//     const lastMessage =
//       messages.length > 1 ? messages[messages.length - 1] : messages[0];
//     const context = (await getContext(
//       lastMessage.content,
//       "",
//       10000,
//       0.7,
//       false,
//     )) as ScoredPineconeRecord[];
//     return NextResponse.json({ context });
//   } catch (e) {
//     console.log(e);
//     return NextResponse.error();
//   }
// }

// this is the actual chat function, which we also have a parallel of in the openai helper file
// import { Configuration, OpenAIApi } from "openai-edge";
// import { Message, OpenAIStream, StreamingTextResponse } from "ai";
// import { getContext } from "@/utils/context";

// // Create an OpenAI API client (that's edge friendly!)
// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(config);

// // IMPORTANT! Set the runtime to edge
// export const runtime = "edge";

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();

//     // Get the last message
//     const lastMessage = messages[messages.length - 1];

//     // Get the context from the last message
//     const context = await getContext(lastMessage.content, "");

//     const prompt = [
//       {
//         role: "system",
//         content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
//       The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
//       AI is a well-behaved and well-mannered individual.
//       AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
//       AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
//       AI assistant is a big fan of Pinecone and Vercel.
//       START CONTEXT BLOCK
//       ${context}
//       END OF CONTEXT BLOCK
//       AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
//       If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
//       AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
//       AI assistant will not invent anything that is not drawn directly from the context.
//       `,
//       },
//     ];

//     // Ask OpenAI for a streaming chat completion given the prompt
//     const response = await openai.createChatCompletion({
//       model: "gpt-3.5-turbo",
//       stream: true,
//       messages: [
//         ...prompt,
//         ...messages.filter((message: Message) => message.role === "user"),
//       ],
//     });
//     // Convert the response into a friendly text-stream
//     const stream = OpenAIStream(response);
//     // Respond with the stream
//     return new StreamingTextResponse(stream);
//   } catch (e) {
//     throw e;
//   }
// }

// export const getContext = async (
//     message: string,
//     namespace: string,
//     maxTokens = 3000,
//     minScore = 0.7,
//     getOnlyText = true,
//   ): Promise<string | ScoredVector[]> => {
//     // Get the embeddings of the input message
//     const embedding = await getEmbeddings(message);

//     // Retrieve the matches for the embeddings from the specified namespace
//     const matches = await getMatchesFromEmbeddings(embedding, 3, namespace);

//     // Filter out the matches that have a score lower than the minimum score
//     const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);

//     if (!getOnlyText) {
//       // Use a map to deduplicate matches by URL
//       return qualifyingDocs;
//     }

//     let docs = matches
//       ? qualifyingDocs.map((match) => (match.metadata as Metadata).chunk)
//       : [];
//     // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
//     return docs.join("\n").substring(0, maxTokens);
//   };

//  replace this with postgre pgvector stuff
// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
// const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string): Promise<ScoredPineconeRecord<Metadata>[]> => {
//   // Obtain a client for Pinecone
//   const pinecone = new Pinecone();

//   const indexName: string = process.env.PINECONE_INDEX || '';
//   if (indexName === '') {
//     throw new Error('PINECONE_INDEX environment variable not set')
//   }

//   // Retrieve the list of indexes to check if expected index exists
//   const indexes = await pinecone.listIndexes()
//   if (indexes.filter(i => i.name === indexName).length !== 1) {
//     throw new Error(`Index ${indexName} does not exist`)
//   }

//   // Get the Pinecone index
//   const index = pinecone!.Index<Metadata>(indexName);

//   // Get the namespace
//   const pineconeNamespace = index.namespace(namespace ?? '')

//   try {
//     // Query the index with the defined request
//     const queryResult = await pineconeNamespace.query({
//       vector: embeddings,
//       topK,
//       includeMetadata: true,
//     })
//     return queryResult.matches || []
//   } catch (e) {
//     // Log the error and throw it
//     console.log("Error querying embeddings: ", e)
//     throw new Error(`Error querying embeddings: ${e}`)
//   }
// }

// export { getMatchesFromEmbeddings }

// export interface Metadata {
//   url: string;
//   text: string;
//   chunk: string;
// }

// The function `getContext` is used to retrieve the context of a given message

// import {
//   Pinecone,
//   type ScoredPineconeRecord,
// } from "@pinecone-database/pinecone";

// export interface Metadata {
//   url: string;
//   text: string;
//   chunk: string;
//   hash: string;
// }
