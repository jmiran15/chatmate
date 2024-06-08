import { useSearchParams } from "@remix-run/react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

import SelectType from "./select-type";
import Website from "./web/website";
import { FileUpload } from "./file/file";
import BlankUpload from "./blank/blank";

export function DialogDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = searchParams?.get("step");
  const type = searchParams?.get("type");

  return (
    <Dialog open={step !== null}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setSearchParams({ step: "type" })}
        >
          Add data
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-fit max-w-lg max-h-xl overflow-auto">
        {step === "type" ? <SelectType /> : null}
        {step === "data" && type === "website" ? <Website /> : null}
        {step === "data" && type === "file" ? <FileUpload /> : null}
        {step === "data" && type === "blank" ? <BlankUpload /> : null}
      </DialogContent>
    </Dialog>
  );
}
