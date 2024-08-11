// import Groq from "groq-sdk";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": "Bearer pk-helicone-ivx7gdy-mbfezoy-tgk3pda-wvlzxzi",
  },
});

export const anyscale = new OpenAI({
  baseURL: process.env.ANYSCALE_BASE_URL,
  apiKey: process.env.ANYSCALE_API_KEY,
});

// export const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });
