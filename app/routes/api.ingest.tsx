// takes a document id

// creates the embeddings for that document

// updates it's progress

// SPLIT DOCUMENT BASED ON SPLITTER FUNCTION --
// const baseChunks: Chunk[] = fileContents.flatMap((document) =>
//   splitStringIntoChunks(document, CHUNK_SIZE, OVERLAP),
// );

// FOR EACH CHUNK - GENERATE A SUMMARY, QUESTIONS, AND EMBEDDINGS FOR ALL THOSE THINGS
// baseChunks.forEach(async (chunk) => {
//   const summary = await generateSummaryForChunk(chunk);
//   const questions = await generatePossibleQuestionsForChunk(chunk);

//   await [chunk, summary, ...questions].map(async (node) => {
//     const embedding = await getEmbeddings({ input: node.content });

//     await prisma.$executeRaw`
//     INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
//     VALUES (${uuidv4()}, ${embedding}::vector, ${
//       node.documentId
//     }, ${chatbotId}, ${chunk.content})
//     `;

//     return {
//       chunk: chunk.content,
//       embedding: embedding,
//       documentId: chunk.documentId,
//       chatbotId,
//     };
//   });
// });

// CONNECT THE EMBEDDINGS TO THE DOCUMENT?
// -- need to take into account that document might already have embeddings

// SAME THING - BUT BATCHING CHUNKS
// console.log("starting");
// const BATCH_SIZE = 10;
// const chunkedBaseChunks = [];
// for (let i = 0; i < baseChunks.length; i += BATCH_SIZE) {
//   chunkedBaseChunks.push(baseChunks.slice(i, i + BATCH_SIZE));
// }

// for (const batchChunks of chunkedBaseChunks) {
//   console.log("Processing batch of chunks");
//   await Promise.all(
//     batchChunks.map(async (chunk, index) => {
//       const [summary, questions] = await Promise.all([
//         generateSummaryForChunk(chunk),
//         generatePossibleQuestionsForChunk(chunk),
//       ]);

//       await Promise.all(
//         [chunk, summary, ...questions].map(async (node) => {
//           const embedding = await getEmbeddings({ input: node.content });
//           await prisma.$executeRaw`
//             INSERT INTO "Embedding" ("id", "embedding", "documentId", "chatbotId", "content")
//             VALUES (${uuidv4()}, ${embedding}::vector, ${
//               node.documentId
//             }, ${chatbotId}, ${chunk.content})
//           `;

//           console.log(
//             `Inserted embedding for chunk ${index} out of ${baseChunks.length}`,
//           );
//           return {
//             chunk: chunk.content,
//             embedding: embedding,
//             documentId: chunk.documentId,
//             chatbotId,
//           };
//         }),
//       );
//     }),
//   );
// }

// console.log("Inserted all embeddings");
