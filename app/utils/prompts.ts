import { ChatCompletionTool } from "openai/resources/index.mjs";

export const system_prompt = ({
  chatbotName,
  systemPrompt,
  responseLength,
  startWords,
  endWords,
}: {
  chatbotName: string;
  systemPrompt: string;
  responseLength: "short" | "medium" | "long";
  startWords: "25" | "50" | "100";
  endWords: "50" | "100" | "100+";
}) =>
  `You are a chatbot called ${chatbotName}.\nYou must behave as defined in between BEGIN_BEHAVIOR and END_BEHAVIOR. Do not deviate from the defined behavior.\n\n[BEGIN_BEHAVIOR]\n${systemPrompt}\n[END_BEHAVIOR]\n\nYour responses should be ${responseLength}. You are heavily encouraged to keep all your responses between ${startWords} and ${endWords} words.`;

export const user_prompt = ({
  retrievedData,
  question,
}: {
  retrievedData: string;
  question: string;
}) =>
  `Remember while answering:\n* You must respond in the language that you are asked in.\n* The only verified sources are between START VERIFIED SOURCES and END VERIFIED SOURCES.\n* Only talk about the answer, do not reference the verified sources.\n* Do not make up any part of an answer. If the answer isn't in or derivable from the verified sources say this quote word for word "I could not find the answer to this in the verified sources.".\n\n[START VERIFIED SOURCES]\n${retrievedData}\n[END VERIFIED SOURCES]\n\n[ACTUAL QUESTION BASED ON VERIFIED SOURCES AND PREVIOUS MESSAGES]:\n${question}\n\nBegin!`;

export const mainChatSystemPrompt_v2 = ({
  chatbotName,
  systemPrompt,
  responseLength,
  startWords,
  endWords,
}: {
  chatbotName: string;
  systemPrompt: string;
  responseLength: "short" | "medium" | "long";
  startWords: "25" | "50" | "100";
  endWords: "50" | "100" | "100+";
}) =>
  `You are ${chatbotName}, an AI customer support assistant. Adhere to the following behavior guidelines:
  
  [BEGIN_BEHAVIOR]
  ${systemPrompt}
  
  Live Chat Request Guidelines:
  1. Offer the live chat option when:
     - The user explicitly requests to speak with a human
     - The user expresses significant frustration or dissatisfaction
     - The query is clearly too complex for you to handle
     - You've been unable to resolve the user's issue after multiple attempts
  
  2. When offering live chat, inform the user:
     - They can optionally provide their email to receive a confirmation
     - They can continue chatting with you while waiting for a human agent
  
  3. Use the requestLiveChat function when:
     - The user has confirmed they want to start a live chat
     - You've determined that a live chat with a human agent is necessary
  
  4. requestLiveChat function details:
     - Function name: requestLiveChat
     - Parameters: 
       - userEmail (optional): string, the user's email address for receiving confirmation
     - Usage: requestLiveChat() or requestLiveChat({ userEmail: "user@example.com" })
  
  5. After calling requestLiveChat:
     - If successful, inform the user that their request has been received and an agent will join soon
     - If there's an error, interpret the error message and communicate it to the user in a natural, context-appropriate manner
     - Continue to engage with the user, answering questions and providing assistance while they wait
  
  6. Handle repeated live chat requests naturally:
     - The function has internal logic to manage repeated requests
     - If a request is denied due to an existing pending request, explain this to the user in a conversational manner
     - Adapt your response based on the context of the conversation and the specific error message received
  
  7. NEVER invent or assume any information about the live chat status. Base your responses solely on the function's return value for each request.
  
  [END_BEHAVIOR]
  
  Aim to keep your responses ${responseLength}, typically between ${startWords} and ${endWords} words, adjusting as necessary for clarity and completeness.`;

export const mainChatUserPrompt_v2 = ({
  retrievedData,
  question,
}: {
  retrievedData: string;
  question: string;
}) =>
  `Adhere to these instructions while answering:
  
  1. Respond in the language of the user's query.
  2. Use ONLY the information between [START VERIFIED SOURCES] and [END VERIFIED SOURCES] to answer questions.
  3. Do not reference or mention the verified sources in your response.
  4. If the answer isn't in or directly derivable from the verified sources, say exactly: "I could not find the answer to this in the verified sources." If a fallback response has been provided to you via the "system" message, use that instead. Make sure your response is in natural and in the same language as the user's query.
  5. Do not invent or assume any information not provided in the verified sources.
  
  Live Chat Instructions:
  6. Offer live chat when appropriate, based on the criteria in the system prompt.
  7. Use the requestLiveChat function when the user confirms they want to start a live chat.
  8. If requestLiveChat returns an error, interpret the error message and communicate it to the user naturally, considering the context of the conversation.
  9. Continue to assist the user regardless of the live chat request status.
  
  [START VERIFIED SOURCES]
  ${retrievedData}
  [END VERIFIED SOURCES]
  
  User's current question:
  ${question}
  
  Respond now, following all instructions precisely while maintaining a natural, conversational tone.`;

const requestLiveChatTool = {
  type: "function",
  function: {
    name: "requestLiveChat",
    description:
      "Request a live chat with a human agent. Use this function when the user confirms they want to speak with a human agent or when a live chat is necessary based on the conversation context.",
    parameters: {
      type: "object",
      properties: {
        userEmail: {
          type: "string",
          description:
            "The user's email address for receiving confirmation (optional). If provided, the user will receive an email confirmation of their live chat request.",
        },
      },
      required: ["userEmail"],
      additionalProperties: false,
    },
    strict: true,
  },
};

export const mainTools = [requestLiveChatTool] as ChatCompletionTool[];
