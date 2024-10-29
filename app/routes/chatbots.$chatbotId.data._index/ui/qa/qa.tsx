import { createId } from "@paralleldrive/cuid2";
import { DocumentType } from "@prisma/client";
import { InfoCircledIcon } from "@radix-ui/react-icons";
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
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { MinimalTiptapEditor } from "~/routes/chatbots.$chatbotId.data._index/ui/minimal-tiptap";
import { STEPS } from "~/utils/types";
import { CustomTooltip } from "./custom-tooltip";
import { FieldDescription } from "./field-description";
import { LabelWithTooltip } from "./label-with-tooltip";
import { MatchTypeExplanation } from "./match-type-explanation";
import { ResponseTypeExplanation } from "./response-type-explanation";
import { TipsAndBestPractices } from "./tips-and-best-practices";

const MAX_CHARACTERS = 10000;

export default function QA({
  setStep,
  setOpen,
  submit,
  prefillQuestion,
  revisionForMessageId,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
  prefillQuestion?: string;
  revisionForMessageId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { chatbotId } = useParams();
  const [question, setQuestion] = useState(prefillQuestion || "");
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
      if (revisionForMessageId) {
        formData.append("revisionForMessageId", revisionForMessageId);
      }

      submit(formData, {
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
        <DialogTitle>Add Q&A</DialogTitle>
        <div className="flex items-center gap-2">
          <DialogDescription>
            Create a question and answer pair for your chatbot.
          </DialogDescription>
          <CustomTooltip content={<TipsAndBestPractices />}>
            <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
          </CustomTooltip>
        </div>
      </DialogHeader>
      <Form
        ref={formRef}
        className="grid gap-6"
        method="post"
        action={`/chatbots/${chatbotId}/data?index`}
      >
        <input type="hidden" name="intent" value="qa" />
        <input type="hidden" name="type" value={DocumentType.RAW} />
        <input type="hidden" name="documentId" value={createId()} />

        <div className="grid gap-2">
          <LabelWithTooltip htmlFor="question" label="Question" />
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the question"
            aria-invalid={errors.question ? true : undefined}
            aria-describedby="question-error"
          />
          <FieldDescription>
            Enter a question that users might ask your chatbot. Be specific and
            concise.
            <em className="block mt-1">
              Example: "What are your business hours?"
            </em>
          </FieldDescription>
        </div>

        <div className="grid gap-2">
          <LabelWithTooltip
            label="Match Type"
            tooltip={<MatchTypeExplanation />}
          />
          <RadioGroup
            value={matchType}
            onValueChange={setMatchType}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="broad" id="broad" />
              <Label htmlFor="broad">Broad</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exact" id="exact" />
              <Label htmlFor="exact">Exact</Label>
            </div>
          </RadioGroup>
          {errors.matchType && (
            <p className="text-sm text-red-500">{errors.matchType}</p>
          )}
        </div>

        <div className="grid gap-2">
          <LabelWithTooltip htmlFor="answer" label="Answer" />
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
          <FieldDescription>
            Provide a detailed response to the question. Include all relevant
            information.
            <em className="block mt-1">
              Example: "Our business hours are Monday to Friday, 9 AM to 5 PM
              Eastern Time. We are closed on weekends and major holidays."
            </em>
          </FieldDescription>
          {errors.answer && (
            <p className="text-sm text-red-500">{errors.answer}</p>
          )}
        </div>

        <div className="grid gap-2">
          <LabelWithTooltip
            label="Response Type"
            tooltip={<ResponseTypeExplanation />}
          />
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
