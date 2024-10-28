import { useSubmit } from "@remix-run/react";
import { STEPS } from "~/utils/types";
import { DialogDemo } from "../chatbots.$chatbotId.data._index/ui/modal";

export const FixAnswerModal = ({ question }: { question?: string }) => {
  const submit = useSubmit();

  return (
    <DialogDemo
      submit={submit}
      prefillQuestion={question}
      prefillStep={STEPS.QA}
    />
  );
};
