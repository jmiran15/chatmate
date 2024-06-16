import Groq from "groq-sdk";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const anyscale = new OpenAI({
  baseURL: process.env.ANYSCALE_BASE_URL,
  apiKey: process.env.ANYSCALE_API_KEY,
});

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
