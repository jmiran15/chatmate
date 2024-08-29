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
