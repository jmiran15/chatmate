import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

import { useParams, useSubmit } from "@remix-run/react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { STEPS } from "~/utils/types";
import BlankUpload from "./blank";
import { FileUpload } from "./file";
import QA from "./qa/qa";
import SelectType from "./select-type";
import Website from "./website";

export function DialogDemo({
  submit,
  prefillStep,
  prefillQuestion,
}: {
  submit: ReturnType<typeof useSubmit>;
  prefillStep?: string;
  prefillQuestion?: string;
}) {
  // we should pass these two down - as parentmodalcontrols ...
  // maybe we should pass the submit down as well?
  const [step, setStep] = useState(prefillStep || STEPS.SELECT_TYPE);
  const [open, setOpen] = useState(false);
  const { chatbotId } = useParams();

  console.log("prefillQuestion", open, prefillQuestion, prefillStep);

  // on mount - stop all jobs that can come from the modal (website, file, blank. ...)
  // and on unmount?

  useEffect(() => {
    submit(
      { intent: "reset" },
      {
        method: "post",
        action: `/chatbots/${chatbotId}/data?index`,
        navigate: false,

        // unstable_flushSync: true
      },
    );
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />{" "}
          <span className="text-md">Add data</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-screen overflow-auto">
        {step === STEPS.SELECT_TYPE ? <SelectType setStep={setStep} /> : null}
        {step === STEPS.WEBSITE ? (
          <Website setStep={setStep} setOpen={setOpen} submit={submit} />
        ) : null}
        {step === STEPS.FILE ? (
          <FileUpload setStep={setStep} setOpen={setOpen} submit={submit} />
        ) : null}
        {step === STEPS.BLANK ? (
          <BlankUpload setStep={setStep} setOpen={setOpen} submit={submit} />
        ) : null}
        {step === STEPS.QA ? (
          <QA
            setStep={setStep}
            setOpen={setOpen}
            submit={submit}
            prefillQuestion={prefillQuestion}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
