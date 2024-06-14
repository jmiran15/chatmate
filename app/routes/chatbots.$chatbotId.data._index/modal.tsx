import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

import SelectType from "./select-type";
import Website from "./website";
import { FileUpload } from "./file";
import BlankUpload from "./blank";
import { useState } from "react";
import { STEPS } from "~/utils/types";

export function DialogDemo() {
  // we should pass these two down - as parentmodalcontrols ...
  const [step, setStep] = useState(STEPS.SELECT_TYPE);
  const [open, setOpen] = useState(false);

  // on mount - stop all jobs that can come from the modal (website, file, blank. ...)
  // and on unmount?

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setStep(STEPS.SELECT_TYPE)}>Add data</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-screen overflow-auto">
        {step === STEPS.SELECT_TYPE ? <SelectType setStep={setStep} /> : null}
        {step === STEPS.WEBSITE ? (
          <Website setStep={setStep} setOpen={setOpen} />
        ) : null}
        {step === STEPS.FILE ? (
          <FileUpload setStep={setStep} setOpen={setOpen} />
        ) : null}
        {step === STEPS.BLANK ? (
          <BlankUpload setStep={setStep} setOpen={setOpen} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
