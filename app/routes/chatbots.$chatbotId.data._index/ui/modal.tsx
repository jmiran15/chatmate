import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

import { useSubmit } from "@remix-run/react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { STEPS } from "~/utils/types";
import BlankUpload from "./blank";
import { FileUpload } from "./file";
import SelectType from "./select-type";
import Website from "./website";

export function DialogDemo({
  submit,
}: {
  submit: ReturnType<typeof useSubmit>;
}) {
  // we should pass these two down - as parentmodalcontrols ...
  // maybe we should pass the submit down as well?
  const [step, setStep] = useState(STEPS.SELECT_TYPE);
  const [open, setOpen] = useState(false);

  // on mount - stop all jobs that can come from the modal (website, file, blank. ...)
  // and on unmount?

  useEffect(() => {
    submit(
      { intent: "reset" },
      {
        method: "post",

        // unstable_flushSync: true
      },
    );
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setStep(STEPS.SELECT_TYPE)}>
          <Plus className="mr-2 h-4 w-4" />{" "}
          <span className="text-md">Add data</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-screen overflow-auto">
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
      </DialogContent>
    </Dialog>
  );
}
