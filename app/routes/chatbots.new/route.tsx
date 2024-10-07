import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { SyntheticEvent, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import * as gtag from "~/utils/gtags.client";

import { SEOHandle } from "@nasa-gcn/remix-seo";
import { prisma } from "~/db.server";
import { createChatbot, getChatbotsByUserId } from "~/models/chatbot.server";
import { requireUserId } from "~/session.server";
import { getPricing } from "~/utils/pricing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // check if user can create a new chatbot, if not, redirect them back to chatbots page
  const userId = await requireUserId(request);
  const pricing = getPricing();
  const chatbots = await getChatbotsByUserId({ userId });

  const subscription = await prisma.subscription.findUnique({
    where: {
      userId,
    },
  });

  const planId = subscription?.planId;
  const pricingPlan = pricing.pricing.find((plan) => plan.planId === planId);
  const chatbotsLimit = pricingPlan?.chatbotsLimit ?? 0;

  if (chatbots.length >= chatbotsLimit) {
    return redirect("/chatbots");
  }

  return json({ chatbots });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const name = await formData.get("name");

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  const chatbot = await createChatbot({ name, userId });
  return redirect(`/chatbots/${chatbot.id}/chats`);
};

export const meta: MetaFunction = () => [{ title: "New chatbot" }];

export default function NewChatbot() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    }
  }, [actionData]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    const target = e.target as typeof e.target & {
      name: { value: string };
    };

    gtag.event({
      action: "new_chatbot",
      category: "chatbots",
      label: target.name.value,
    });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      method="post"
      className="flex flex-col gap-8 w-full py-12 px-8 md:px-20 xl:px-96"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name: </Label>

        <Input
          ref={nameRef}
          id="name"
          name="name"
          aria-invalid={actionData?.errors?.name ? true : undefined}
          aria-errormessage={
            actionData?.errors?.name ? "title-error" : undefined
          }
        />
        {actionData?.errors?.name ? (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.name}
          </div>
        ) : null}
      </div>

      <div className="text-right">
        <Button type="submit">Save</Button>
      </div>
    </Form>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
