import { Chat, Message } from "@prisma/client";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import uap from "ua-parser-js";
import { prisma } from "~/db.server";

interface ChatWithMessagesAndCount extends Chat {
  messages: Message[];
  _count: {
    messages: number;
  };
}

export async function getLatestChatBySessionID({
  sessionId,
}: {
  sessionId: string;
}): Promise<ChatWithMessagesAndCount | null> {
  return prisma.chat.findFirst({
    where: {
      sessionId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              seenByUser: false,
              role: "assistant",
            },
          },
        },
      },
    },
  });
}

export async function getChatById({ chatId }: { chatId: string }) {
  return prisma.chat.findUniqueOrThrow({
    where: {
      id: chatId,
    },
  });
}

export async function createAnonymousChat({
  sessionId,
  chatbotId, // should probably only fetch chatbot once and then just cache
}: {
  sessionId: string;
  chatbotId: string;
}): Promise<ChatWithMessagesAndCount | null> {
  const chatbot = await prisma.chatbot.findUniqueOrThrow({
    where: {
      id: chatbotId,
    },
  });

  return prisma.chat.create({
    data: {
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
      messages: {
        create: chatbot.introMessages.map((question) => ({
          role: "assistant",
          content: question,
        })),
      },
      sessionId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              seenByUser: false,
              role: "assistant",
            },
          },
        },
      },
    },
  });
}

export async function getAnonymousUserBySessionId({
  sessionId,
}: {
  sessionId: string;
}) {
  return prisma.anonymousUser.findUnique({
    where: {
      sessionId: sessionId,
    },
  });
}

export async function createAnonymousUser({
  sessionId,
  request,
  chatId,
}: {
  sessionId: string;
  request: Request;
  chatId: string;
}) {
  const isDev = process.env.NODE_ENV === "development";
  const ipAddress = isDev ? "8.8.8.8" : getClientIPAddress(request);
  const ua = uap(request.headers.get("User-Agent")!);

  try {
    const ipapiResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    const ipData = await ipapiResponse.json();

    return prisma.anonymousUser.create({
      data: {
        sessionId,
        ...ipData,
        ua: ua.ua,
        browser_name: ua.browser.name,
        browser_version: ua.browser.version,
        browser_major: ua.browser.major,
        cpu_architecture: ua.cpu.architecture,
        device_type: ua.device.type,
        device_vendor: ua.device.vendor,
        device_model: ua.device.model,
        engine_name: ua.engine.name,
        engine_version: ua.engine.version,
        os_name: ua.os.name,
        os_version: ua.os.version,
        chat: {
          connect: {
            id: chatId,
          },
        },
      },
    });
  } catch (error) {
    console.error("error creating anonymous user", error);
  }
}

export async function createMessage({
  id,
  role,
  content,
  chatId,
}: Pick<Message, "role" | "content"> & {
  id?: Message["id"];
  chatId: Chat["id"];
}) {
  return prisma.message.create({
    data: {
      ...(id ? { id } : {}),
      role,
      content,
      chat: {
        connect: {
          id: chatId,
        },
      },
    },
  });
}
