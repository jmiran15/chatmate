// TODO - implement some logic in here so that Forms can't be sent multiple times??? -> maybe this is better to just put in the description/prompt of the trigger
// i.e. only call this once, and in the worst case, we fine tune to teach it this
// get the flow schema from the database

import { createId } from "@paralleldrive/cuid2";
import {
  ActionType,
  type Action,
  type Flow,
  type Message,
  type Trigger,
} from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "~/db.server";
import { getIO } from "~/utils/socketmanager.server";

export async function callCustomFlow(flowId: string, chatId: string) {
  const flow = await getFlow(flowId);

  if (!flow || !flow.trigger || !flow.actions) {
    return {
      success: false,
      error: "Invalid flow schema",
    };
  }

  const actions = flow.actions;

  if (!actions || actions.length === 0) {
    console.warn("No actions found in flow schema.");
    return { success: false, error: "No actions to process" }; // TODO - probably return success?
  }

  const formActions = actions.filter(
    (action) => action.type === ActionType.FORM,
  );

  const formMessagesCount = await prisma.message.count({
    where: {
      chatId,
      isFormMessage: true,
      formId: {
        in: formActions
          .filter((action) => action.formId !== undefined)
          .map((action) => action.formId!),
      },
    },
  });

  if (formMessagesCount > 0) {
    return {
      success: false,
      error: "Form already sent",
    };
  }

  const io = getIO();

  // process sequentially
  for (const action of actions) {
    const result = await processAction(action, chatId, io);
    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  return { success: true };
}

export async function processAction(
  action: Action,
  chatId: string,
  io: Server | undefined,
) {
  const isForm = action.type === ActionType.FORM;

  const newMessage = {
    id: createId(),
    role: "assistant",
    content: action.text ?? "",
    // chatId,
    seenByUser: false,
    seenByAgent: true,
    chat: {
      connect: {
        id: chatId,
      },
    },
    flow: {
      connect: {
        id: action.flowId,
      },
    },
    ...(isForm
      ? {
          isFormMessage: true,
          form: {
            connect: {
              id: action.formId,
            },
          },
        }
      : {}),
  } as Partial<Message>;

  const createdMessage = await prisma.message.create({
    data: {
      ...newMessage,
    },
    ...(isForm
      ? {
          include: {
            form: {
              include: {
                elements: true,
              },
            },
            formSubmission: true,
          },
        }
      : {}),
  });

  console.log("createdMessage", createdMessage);

  if (!createdMessage) {
    return {
      success: false,
      error: "Failed to create a text message",
    };
  }

  if (io) {
    const delayedMessage = {
      ...createdMessage,
      streaming: true,
      loading: true,
      delay: action.delay,
    };

    io.emit("new message", {
      chatId,
      message: delayedMessage,
    });
  } else {
    console.warn("Socket.IO instance not initialized");
  }

  return {
    success: true,
    message: createdMessage,
  };
}

// helper functions
async function getFlow(flowId: string): Promise<
  | (Flow & {
      trigger: Trigger | null;
      actions: Action[];
    })
  | null
> {
  const flow = await prisma.flow.findUnique({
    where: {
      id: flowId,
    },
    include: {
      trigger: true,
      actions: {
        where: {
          dependsOn: {
            none: {},
          },
        },
        orderBy: {
          order: "asc",
        },
        include: {
          dependsOn: true,
        },
      },
    },
  });

  return flow;
}
