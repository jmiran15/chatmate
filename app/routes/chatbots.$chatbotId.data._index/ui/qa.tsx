import { createId } from "@paralleldrive/cuid2";
import { DocumentType } from "@prisma/client";
import { Form, useParams, useSubmit } from "@remix-run/react";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { MinimalTiptapEditor } from "~/routes/chatbots.$chatbotId.data._index/ui/minimal-tiptap";
import { STEPS } from "~/utils/types";

const MAX_CHARACTERS = 10000;

export default function QA({
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
  const [question, setQuestion] = useState("");
  const [matchType, setMatchType] = useState("broad");
  const [answer, setAnswer] = useState<string>("");
  const [responseType, setResponseType] = useState("generative");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characterCount, setCharacterCount] = useState(0);

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!question.trim()) {
      newErrors.question = "Question is required";
    }

    if (!matchType) {
      newErrors.matchType = "Match type is required";
    }

    if (!answer) {
      newErrors.answer = "Answer is required";
    }

    if (!responseType) {
      newErrors.responseType = "Response type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (validateForm() && answer) {
      setOpen(false);
      const formData = new FormData(formRef.current!);
      formData.append("question", question);
      formData.append("matchType", matchType.toUpperCase());
      formData.append("answer", answer);
      formData.append("responseType", responseType.toUpperCase());
      formData.append("intent", "qa");

      submit(formData, {
        method: "post",
        navigate: false,
        fetcherKey: `${chatbotId}-${Date.now()}`,
      });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Q&A</DialogTitle>
        <DialogDescription>
          Create a question and answer pair for your chatbot.
        </DialogDescription>
      </DialogHeader>
      <Form
        ref={formRef}
        className="grid gap-4"
        method="post"
        action={`/chatbots/${chatbotId}/data?index`}
      >
        <input type="hidden" name="intent" value="qa" />
        <input type="hidden" name="type" value={DocumentType.RAW} />
        <input type="hidden" name="documentId" value={createId()} />

        <div className="grid gap-2">
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question"
            aria-invalid={errors.question ? true : undefined}
            aria-describedby="question-error"
          />
          {errors.question && (
            <p className="text-sm text-red-500" id="question-error">
              {errors.question}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Match Type</Label>
          <RadioGroup
            value={matchType}
            onValueChange={setMatchType}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exact" id="exact" />
              <Label htmlFor="exact">Exact</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="broad" id="broad" />
              <Label htmlFor="broad">Broad</Label>
            </div>
          </RadioGroup>
          {errors.matchType && (
            <p className="text-sm text-red-500">{errors.matchType}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="answer">Answer</Label>
          <div className="relative">
            <MinimalTiptapEditor
              value={answer}
              onChange={(newContent: string) => {
                setAnswer(newContent);
                setCharacterCount(
                  JSON.stringify(newContent).replace(/[{}[\],"]/g, "").length,
                );
              }}
              className="min-h-[200px] resize-y overflow-y-auto"
              editorContentClassName="p-3"
              placeholder="Enter your answer here..."
              editorProps={{
                attributes: {
                  class: "focus:outline-none",
                },
              }}
              maxLength={MAX_CHARACTERS}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-500">
              {characterCount}/{MAX_CHARACTERS}
            </div>
          </div>
          {errors.answer && (
            <p className="text-sm text-red-500">{errors.answer}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Response Type</Label>
          <RadioGroup
            value={responseType}
            onValueChange={setResponseType}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="static" id="static" />
              <Label htmlFor="static">Static</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="generative" id="generative" />
              <Label htmlFor="generative">Generative</Label>
            </div>
          </RadioGroup>
          {errors.responseType && (
            <p className="text-sm text-red-500">{errors.responseType}</p>
          )}
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
          <Button onClick={handleSubmit}>Add Q&A</Button>
        </div>
      </DialogFooter>
    </>
  );
}
