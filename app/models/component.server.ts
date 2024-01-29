import { v4 as uuidv4 } from "uuid";
import { USER_INPUT_UUID } from "~/utils/helpers";
import { UUID } from "~/reducers/graphReducer";
import { Model } from "@prisma/client";

import { prisma } from "~/db.server";

export function createChatComponent({
  chatbotReferenceId,
}: {
  chatbotReferenceId: UUID;
}) {
  const id = uuidv4();

  return prisma.chatComponent.create({
    data: {
      id,
      name: "new chat component",
      model: Model.GPT4,
      temperature: 0.7,
      maxTokens: 256,
      systemPrompt: "You are a helpful assitant",
      userPrompt: `{{${USER_INPUT_UUID}}}`,
      chatbotReferenceId,
      historyId: id,
    },
  });
}

export function createDocumentComponent({
  chatbotReferenceId,
}: {
  chatbotReferenceId: UUID;
}) {
  const id = uuidv4();

  return prisma.documentComponent.create({
    data: {
      id,
      name: "new document component",
      numberOfDocuments: 10,
      similarity: 0.7,
      searchQuery: `{{${USER_INPUT_UUID}}}`,
      chatbotReferenceId,
    },
  });
}

// get component by id, need to check if it is chat or document component. need to try to get chatComponent and documentComponent
// if chatComponent is null, then it is documentComponent
// if documentComponent is null, then it is chatComponent
export function getComponentById(id: UUID) {
  return prisma.chatComponent
    .findUnique({
      where: {
        id,
      },
    })
    .then((chatComponent) => {
      if (chatComponent) {
        return {
          type: "chat",
          component: chatComponent,
        };
      } else {
        const documentComponent = prisma.documentComponent.findUnique({
          where: {
            id,
          },
        });
        return {
          type: "document",
          component: documentComponent,
        };
      }
    });
}

// get all chat components for a chatbot
export function getChatComponents({
  chatbotReferenceId,
}: {
  chatbotReferenceId: UUID;
}) {
  return prisma.chatComponent.findMany({
    where: {
      chatbotReferenceId,
    },
  });
}

// get all document components for a chatbot
export function getDocumentComponents({
  chatbotReferenceId,
}: {
  chatbotReferenceId: UUID;
}) {
  return prisma.documentComponent.findMany({
    where: {
      chatbotReferenceId,
    },
  });
}
