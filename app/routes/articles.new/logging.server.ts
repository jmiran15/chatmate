import fs from "fs/promises";
import path from "path";
import { DateTime } from "luxon";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

interface APILogEntry {
  llm: string;
  timestamp: string;
  model: string;
  messages: ChatCompletionMessageParam[];
  response: string;
}

async function logAPICall(entry: APILogEntry): Promise<void> {
  const timestamp = DateTime.now().toFormat("yyyy-MM-dd_HH-mm-ss");
  const filename = `openai-api-call-${timestamp}.log`;
  const logDir = path.join(process.cwd(), "logs", "openai");

  try {
    await fs.mkdir(logDir, { recursive: true });

    const logContent = formatLogEntry(entry);
    await fs.writeFile(path.join(logDir, filename), logContent);
    console.log(`📝 API call logged: ${entry.llm} - ${filename}`);
  } catch (error) {
    console.error(`❌ ERROR LOGGING API CALL:`, error);
  }
}

function formatLogEntry(entry: APILogEntry): string {
  return `
LLM: ${entry.llm}
Timestamp: ${entry.timestamp}
Model: ${entry.model}

Request:
${entry.messages.map((msg) => `[${msg.role}]: ${msg.content}`).join("\n\n")}

Response:
${entry.response}
`.trim();
}

export { logAPICall };
