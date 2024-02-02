import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embed({ input }: { input: string }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

// response
// {
//   "object": "list",
//   "data": [
//     {
//       "object": "embedding",
//       "embedding": [
//         0.0023064255,
//         -0.009327292,
//         .... (1536 floats total for ada-002)
//         -0.0028842222,
//       ],
//       "index": 0
//     }
//   ],
//   "model": "text-embedding-ada-002",
//   "usage": {
//     "prompt_tokens": 8,
//     "total_tokens": 8
//   }
// }
