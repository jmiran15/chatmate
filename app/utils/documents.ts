export const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize),
  );
};

import { ScoredVector } from "@pinecone-database/pinecone";
import { getMatchesFromEmbeddings } from "./pinecone";
import { getEmbeddings } from "./embeddings";

export interface Metadata {
  url: string;
  text: string;
  chunk: string;
}

// The function `getContext` is used to retrieve the context of a given message
// export const getContext = async (
//   message: string,
//   namespace: string,
//   maxTokens = 3000,
//   minScore = 0.7,
//   getOnlyText = true,
// ): Promise<string | ScoredVector[]> => {
//   // Get the embeddings of the input message
//   const embedding = await getEmbeddings(message);

//   // Retrieve the matches for the embeddings from the specified namespace
//   const matches = await getMatchesFromEmbeddings(embedding, 3, namespace);

//   // Filter out the matches that have a score lower than the minimum score
//   const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);

//   if (!getOnlyText) {
//     // Use a map to deduplicate matches by URL
//     return qualifyingDocs;
//   }

//   let docs = matches
//     ? qualifyingDocs.map((match) => (match.metadata as Metadata).chunk)
//     : [];
//   // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
//   return docs.join("\n").substring(0, maxTokens);
// };

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
