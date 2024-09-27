import { createId } from "@paralleldrive/cuid2";
import type { Action as ActionType } from "@prisma/client";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
  SerializeFrom,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { Plus } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { prisma } from "~/db.server";
import { useFormChanged } from "~/hooks/useFormChanged";
import Action from "./action";
import Header from "./header";
import Trigger from "./trigger";
import { actionSchema } from "./types";
import { formDataToFlowSchema, getAvailableFormElementNames } from "./utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { chatbotId, flowId } = params;

  if (!chatbotId || !flowId) {
    throw new Error("Chatbot ID and Flow ID are required");
  }

  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      trigger: true,
      actions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!flow) {
    throw new Error("Flow not found");
  }

  if (flow.chatbotId !== chatbotId) {
    throw new Error("Flow does not belong to this chatbot");
  }

  const forms = await prisma.form.findMany({
    where: { chatbotId },
    include: { elements: true },
  });

  return json({
    name: flow.name,
    trigger: flow.trigger,
    actions: flow.actions,
    forms,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { chatbotId, flowId } = params;

  if (!chatbotId || !flowId) {
    throw new Error("Chatbot ID and Flow ID are required");
  }

  const formData = await request.formData();
  const action = String(formData.get("intent"));

  switch (action) {
    case "save": {
      const { trigger, actions } = formDataToFlowSchema(formData);

      // Update the flow in the database
      await prisma.$transaction(async (tx) => {
        // Upsert Trigger if defined
        if (trigger) {
          await tx.trigger.upsert({
            where: { flowId: flowId },
            create: {
              ...trigger,
              flowId: flowId,
            },
            update: trigger,
          });
        }

        // Upsert Actions if defined and not empty
        if (actions && actions.length > 0) {
          for (const action of actions) {
            const { mentions, ...actionData } = action;
            const upsertedAction = await tx.action.upsert({
              where: { id: action.id },
              create: {
                ...actionData,
                flowId: flowId,
              },
              update: actionData,
            });

            console.log("upsertedAction", upsertedAction);

            // Handle FormsOnActions
            if (action.type === "TEXT" && mentions && mentions.length > 0) {
              console.log("mentions", mentions);
              // Delete existing FormsOnActions for this action
              const existingFormsOnActions = await tx.formsOnActions.deleteMany(
                {
                  where: { actionId: upsertedAction.id },
                },
              );

              console.log("existingFormsOnActions", existingFormsOnActions);

              // Create new FormsOnActions
              const uniqueFormElementIds = [
                ...new Set(mentions.map((m) => m.id)),
              ];

              console.log("uniqueFormElementIds", uniqueFormElementIds);

              // get the form elements from the database
              const formElements = await tx.formElement.findMany({
                where: { id: { in: uniqueFormElementIds } },
                select: { id: true, name: true, formId: true },
              });

              console.log("formElements", formElements);

              const createdFormsOnActions = await tx.formsOnActions.createMany({
                data: formElements.map((formElement) => ({
                  actionId: upsertedAction.id,
                  formId: formElement.formId,
                })),
              });

              console.log("createdFormsOnActions", createdFormsOnActions);
            }
          }
        }
      });

      return json({ success: true });
    }
    case "deleteAction": {
      const actionId = String(formData.get("actionId"));
      const action = await prisma.action.delete({ where: { id: actionId } });
      return json({ action });
    }
    case "deleteFlow": {
      await prisma.flow.delete({ where: { id: flowId } });
      return redirect(`/chatbots/${chatbotId}/flows`);
    }
    case "insert": {
      const pendingAction = formData.get("pendingAction");

      const parsedAction = pendingAction
        ? JSON.parse(pendingAction as string)
        : null;

      const newAction = actionSchema.parse(parsedAction);

      console.log("newAction", newAction);

      if (!newAction) {
        throw new Error("Invalid action");
      }

      const action = await prisma.action.create({
        data: {
          ...newAction,
          flowId,
        },
      });

      if (!action) {
        throw new Error("Failed to create action");
      }

      return json({ action });
    }
    default:
      throw new Error("Invalid action");
  }
};

export default function FlowMaker() {
  const { name, trigger, actions, forms } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { formRef, isChanged, handleFormChange } = useFormChanged();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteFetcher = useFetcher({ key: "deleteAction" });
  const deleteFlowFetcher = useFetcher({ key: "deleteFlow" });
  const insertFetcher = useFetcher({ key: "insertAction" });
  const navigation = useNavigation();
  const [lastAddedActionId, setLastAddedActionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    // TODO - for form validation server side
    console.log("actionData", actionData);

    // IF error, show errors wherever they are
    // O/W, toast success
  }, [actionData]);

  function handleDeleteFlow() {
    deleteFlowFetcher.submit(
      { intent: "deleteFlow" },
      { method: "post", preventScrollReset: true },
    );
    setIsDeleteDialogOpen(false);
  }

  const handleInsert = useCallback(
    (prevOrder: number, nextOrder?: number) => {
      const order = nextOrder
        ? prevOrder + (nextOrder - prevOrder) / 2
        : prevOrder + 1;

      const newAction =
        forms.length > 0
          ? {
              id: createId(),
              type: "FORM" as const,
              formId: forms[0].id,
              delay: 1,
              order,
            }
          : {
              id: createId(),
              type: "TEXT" as const,
              text: "",
              delay: 1,
              order,
            };

      setLastAddedActionId(newAction.id);

      insertFetcher.submit(
        {
          intent: "insert",
          pendingAction: JSON.stringify(newAction),
        },
        { method: "POST", preventScrollReset: true },
      );
    },
    [forms, insertFetcher],
  );

  const pendingDelete =
    deleteFetcher.formData &&
    deleteFetcher.formData.get("intent") === "deleteAction"
      ? (deleteFetcher.formData.get("actionId") as string)
      : null;

  const pendingInsert =
    insertFetcher.formData && insertFetcher.formData.get("intent") === "insert"
      ? {
          action: JSON.parse(
            insertFetcher.formData.get("pendingAction") as string,
          ),
        }
      : null;

  const pendingSave =
    navigation.formData && navigation.formData.get("intent") === "save"
      ? formDataToFlowSchema(navigation.formData)
      : null;

  const optimisticActions = useMemo(() => {
    let updatedActions: Partial<SerializeFrom<ActionType>>[] = [...actions];

    if (pendingDelete) {
      updatedActions = updatedActions.filter(
        (action) => action.id !== pendingDelete,
      );
    }

    if (pendingInsert) {
      updatedActions.push({ ...pendingInsert.action });
    }

    if (pendingSave) {
      updatedActions = pendingSave.actions ?? updatedActions;
    }

    return updatedActions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [actions, pendingDelete, pendingInsert, pendingSave]);

  const optimisticTrigger = useMemo(() => {
    if (pendingSave && pendingSave.trigger) {
      return pendingSave.trigger;
    }
    return trigger;
  }, [trigger, pendingSave]);

  if (!optimisticTrigger || !actions) {
    return null;
  }

  return (
    <div className="mx-auto p-4 h-full overflow-hidden">
      <Form
        method="post"
        ref={formRef}
        onChange={handleFormChange}
        className="flex flex-col h-full overflow-y-auto"
      >
        <input type="hidden" name="intent" value="save" />
        <input type="hidden" name="triggerId" value={optimisticTrigger.id} />
        <Header
          flowName={name}
          handleDelete={handleDeleteFlow}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          canSave={isChanged}
        />
        <div className="gap-6 mt-4 w-full h-full flex flex-col items-center">
          <Trigger
            trigger={optimisticTrigger}
            handleFormChange={handleFormChange}
          />
          {optimisticActions.map((action, index) => {
            const availableFormElementNames = getAvailableFormElementNames(
              optimisticActions.slice(0, index),
              forms,
            );
            return (
              <Fragment key={action.id}>
                <Action
                  action={action}
                  index={index}
                  forms={forms}
                  availableFormElementNames={availableFormElementNames}
                  onDelete={(actionId) => {
                    deleteFetcher.submit(
                      { intent: "deleteAction", actionId },
                      { method: "POST" },
                    );
                  }}
                  handleFormChange={handleFormChange}
                  isNewlyAdded={action.id === lastAddedActionId}
                />
                <Button
                  type="button"
                  onClick={() =>
                    handleInsert(
                      action.order ?? 0,
                      optimisticActions[index + 1]?.order,
                    )
                  }
                  className="rounded-full p-2"
                  variant="ghost"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </Fragment>
            );
          })}
        </div>
      </Form>
    </div>
  );
}

export const handle = {
  PATH: (chatbotId: string) => `/chatbots/${chatbotId}/flows`,
  breadcrumb: "flows",
};
