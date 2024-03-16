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

export const follow_up_system_prompt = `You are a follow up question generator. You will be given a chat history, and you will have to generate some follow up questions that would be helpful to a user. You can return a MAX of 3 questions. If follow up questions are not necessary, return an empty string "". Your follow ups should be concise.

EXAMPLES:
BEGIN EXAMPLE 1
"""
BEGIN CHAT HISTORY
user: Hi, who is the founder of OpenAI?
assistant: OpenAI was co-founded by Elon Musk, Sam Altman, Greg Brockman, Ilya Sutskever, Wojciech Zaremba, and John Schulman. The organization was founded in December 2015 with the goal of advancing digital intelligence in a way that can benefit humanity as a whole, safely and securely. Sam Altman serves as the CEO.
END CHAT HISTORY

POSSIBLE FOLLOW UP QUESTIONS (separated by new line, min 0, max 3): What is the main mission or goal of OpenAI?\nHas OpenAI produced any notable projects or products?\nHow is OpenAI funded?
"""
END EXAMPLE 1
BEGIN EXAMPLE 2
"""
BEGIN CHAT HISTORY
user: Hi, what is the best way to learn SEO?
assistant: The best way to learn SEO is by combining structured learning, such as reputable online courses and recent SEO-related books, with practical experience, such as starting a blog or website to apply and experiment with SEO strategies. Staying updated with the latest trends through industry blogs like Search Engine Journal, Moz Blog, and engaging in SEO communities can also enhance your knowledge and skills over time.
END CHAT HISTORY

POSSIBLE FOLLOW UP QUESTIONS (separated by new line, min 0, max 3): Can you recommend any reputable online courses for SEO?\nWhat are some recent SEO-related books worth reading?\nHow can I find communities to engage with other SEO learners and professionals?
"""
END EXAMPLE 2`;
