import { useSearchParams } from "@remix-run/react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

import SelectType from "./select-type";
import Website from "./website";
import { FileUpload } from "./file";
import BlankUpload from "./blank";
import { useEffect, useState } from "react";

export function DialogDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const step = searchParams?.get("step");
  const type = searchParams?.get("type");

  useEffect(() => {
    if (!searchParams.get("step")) {
      setOpen(false);
    }
  }, [searchParams]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setSearchParams({ step: "type" })}>
          Add data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-screen overflow-auto">
        {step === "type" ? <SelectType /> : null}
        {step === "data" && type === "website" ? <Website /> : null}
        {step === "data" && type === "file" ? <FileUpload /> : null}
        {step === "data" && type === "blank" ? <BlankUpload /> : null}
      </DialogContent>
    </Dialog>
  );
}
