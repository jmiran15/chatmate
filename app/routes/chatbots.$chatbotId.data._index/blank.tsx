import { DocumentType } from "@prisma/client";
import { Form, useParams, useSubmit } from "@remix-run/react";
import { useRef } from "react";
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
import { createId } from "@paralleldrive/cuid2";

export default function BlankUpload({
  setStep,
  setOpen,
  submit,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { chatbotId } = useParams();

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
        <input type="hidden" name="intent" value="blank" />
        <input type="hidden" name="type" value={DocumentType.RAW} />
        <input type="hidden" name="documentId" value={createId()} />
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            name="name"
            autoComplete="name"
            id="name"
            type="text"
            placeholder="Name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            name="content"
            autoComplete="content"
            id="content"
            placeholder="Content"
            required
          />
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
          <Button
            onClick={() => {
              setOpen(false);
              submit(formRef.current, {
                method: "post",
                navigate: false,
                fetcherKey: `${chatbotId}-${Date.now()}`,
              });
            }}
          >
            Upload
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
