// app/routes/chat.js
import { ActionFunctionArgs } from "@remix-run/node";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Only POST requests are allowed on this endpoint", {
      status: 405,
    });
  }

  const body = JSON.parse(await request.text());
  const { message, sessionId, prompt, model, temperature } = body;
  const openai = new OpenAI(); // Ensure your API key is appropriately set up

  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          const chatStream = await openai.chat.completions.create({
            model: model || "gpt-4",
            messages: [{ role: "user", content: message }],
            temperature: temperature,
            stream: true,
          });

          for await (const chunk of chatStream) {
            for (const choice of chunk.choices) {
              console.log("choice", choice);

              const delta = choice.delta?.content;
              if (!delta) continue;

              controller.enqueue(
                `data: ${JSON.stringify({
                  uuid: "1",
                  type: "textResponseChunk",
                  textResponse: delta,
                  sources: [],
                  error: false,
                  close: false,
                })}\n\n`,
              );
            }

            controller.enqueue(
              `data: ${JSON.stringify({
                uuid: "1",
                type: "textResponseChunk",
                textResponse: "",
                sources: [],
                error: false,
                close: true,
              })}\n\n`,
            );
          }
        } catch (error) {
          controller.enqueue(
            `data: ${JSON.stringify({
              uuid: "1",
              type: "abort",
              textResponse: null,
              sources: [],
              error: error.message,
              close: true,
            })}\n\n`,
          );
        }

        controller.close();
      })();
    },
  });

  const headers = {
    "Access-Control-Allow-Origin": "*", // Allow any domain
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  return new Response(stream, {
    headers,
  });
};
