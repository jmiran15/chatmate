// this should be a function that takes in a toolId (i.e. the tool that was called, e.g, sendPricingCarousel)

import { createId } from "@paralleldrive/cuid2";
import { type Message } from "@prisma/client";
import { prisma } from "~/db.server";
import { getIO } from "~/utils/socketmanager.server";

// gets the "flow" schema of that toolId from the database, and the turns that flow into a function
export async function callCustomFlow(toolId: string, chatId: string) {
  // we should also implmeent some logic in here so that Forms can't be sent multiple times??? -> maybe this is better to just put in the description/prompt of the trigger
  // i.e. only call this once, and in the worst case, we fine tune to teach it this
  // get the flow schema from the database
  const flow = await prisma.flow.findUnique({
    where: {
      id: toolId,
    },
  });

  if (!flow || !flow.flowSchema) {
    return {
      success: false,
      error: "Invalid flow schema",
    };
  }

  const flowSchema = flow.flowSchema;

  const actions = flowSchema.actions;

  console.log("The actions are: ", actions);

  // check if there are any actions that are of type form
  const formActions = actions.filter((action) => action.type === "form");

  // now search for messages with isForm and formId
  const formMessages = await prisma.message.findMany({
    where: {
      chatId,
      isFormMessage: true,
      formId: {
        in: formActions.map((action) => action.formId),
      },
    },
  });

  console.log("Form messages are: ", formMessages.length);

  if (formMessages.length > 0) {
    return {
      success: false,
      error: "Form already sent",
    };
  }

  const triggerType = flow.trigger;

  for (const action of actions) {
    if (action.type === "text") {
      const newMessage = {
        id: createId(),
        role: "assistant",
        content: action.text,
        chatId,
        seenByUser: false,
        seenByAgent: true,
      } as Message;

      const createdMessage = await prisma.message.create({
        data: newMessage,
      });

      console.log("Created a message for the text: ", createdMessage);

      if (!createdMessage) {
        return {
          success: false,
          error: "Failed to create request live chat message",
        };
      }

      const io = getIO();
      if (io) {
        if (triggerType === "CUSTOM_EVENT") {
          // Simulate typing and delay only for CUSTOM_EVENT triggers
          io.emit("agent typing", { isTyping: true, chatId });

          await new Promise((resolve) =>
            setTimeout(resolve, action.delay * 1000),
          );

          io.emit("agent typing", { isTyping: false, chatId });
        }

        io.emit("new message", {
          chatId,
          message: createdMessage,
        });
      } else {
        console.warn("Socket.IO instance not initialized");
      }
    } else if (action.type === "form") {
      const newMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        chatId,
        seenByUser: false,
        seenByAgent: true,
        isFormMessage: true,
        formId: action.formId,
      } as Message;

      const createdMessage = await prisma.message.create({
        data: newMessage,
        include: {
          form: true, // so we can send over the formSchema
          formSubmission: true, // so we can see if the form was submitted
        },
      });

      console.log("Created a message for the form: ", createdMessage);

      if (!createdMessage) {
        return {
          success: false,
          error: "Failed to create request live chat message",
        };
      }

      const io = getIO();
      if (io) {
        if (triggerType === "CUSTOM_EVENT") {
          // Simulate typing and delay only for CUSTOM_EVENT triggers
          io.emit("agent typing", { isTyping: true, chatId });

          await new Promise((resolve) =>
            setTimeout(resolve, action.delay * 1000),
          );

          io.emit("agent typing", { isTyping: false, chatId });
        }

        io.emit("new message", {
          chatId,
          message: createdMessage,
        });
      } else {
        console.warn("Socket.IO instance not initialized");
      }
    }
  }

  return { success: true };
}
