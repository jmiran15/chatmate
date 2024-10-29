import { createId } from "@paralleldrive/cuid2";
import { DocumentType } from "@prisma/client";
import { Form, useParams, useSubmit } from "@remix-run/react";
import confetti from "canvas-confetti";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { STEPS } from "~/utils/types";

export default function BlankUpload({
  setStep,
  setOpen,
  submit,
  revisionForMessageId,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
  revisionForMessageId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { chatbotId } = useParams();
  const nameRef = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  function handleSubmit() {
    if (nameRef.current?.value.length === 0) {
      setNameError("Name is required");
      nameRef.current?.focus();
      return;
    } else {
      setNameError(null);
    }

    if (contentRef.current?.value.length === 0) {
      setContentError("Content is required");
      contentRef.current?.focus();
      return;
    } else {
      setContentError(null);
    }

    if (
      nameRef.current?.value.length !== 0 &&
      contentRef.current?.value.length !== 0
    ) {
      setOpen(false);
      submit(formRef.current, {
        method: "post",
        navigate: false,
        fetcherKey: `${chatbotId}-${Date.now()}`,
        action: `/chatbots/${chatbotId}/data?index`,
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Blank</DialogTitle>
        <DialogDescription>
          Upload a blank file to use as a starting point for your chatbot.
        </DialogDescription>
      </DialogHeader>
      <Form
        ref={formRef}
        className="grid gap-4"
        method="post"
        action={`/chatbots/${chatbotId}/data?index`}
      >
        {revisionForMessageId ? (
          <input
            type="hidden"
            name="revisionForMessageId"
            value={revisionForMessageId}
          />
        ) : null}
        <input type="hidden" name="intent" value="blank" />
        <input type="hidden" name="type" value={DocumentType.RAW} />
        <input type="hidden" name="documentId" value={createId()} />
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            ref={nameRef}
            aria-invalid={nameError ? true : undefined}
            aria-describedby="name-error"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={true}
            name="name"
            autoComplete="name"
            id="name"
            type="text"
            placeholder="Name"
            required
          />

          {nameError ? (
            <p
              className="pt-1 text-red-500 text-sm font-medium leading-none"
              id="url-error"
            >
              {nameError}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            ref={contentRef}
            aria-invalid={contentError ? true : undefined}
            aria-describedby="content-error"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={true}
            name="content"
            autoComplete="content"
            id="content"
            placeholder="Content"
            required
          />
          {contentError ? (
            <p
              className="pt-1 text-red-500 text-sm font-medium leading-none"
              id="content-error"
            >
              {contentError}
            </p>
          ) : null}
        </div>
      </Form>
      <DialogFooter>
        <div className="w-full flex flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setStep(STEPS.SELECT_TYPE);
            }}
          >
            Back
          </Button>
          <Button onClick={handleSubmit}>Upload</Button>
        </div>
      </DialogFooter>
    </>
  );
}
