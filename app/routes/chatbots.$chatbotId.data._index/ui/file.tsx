import { createId } from "@paralleldrive/cuid2";
import { useParams, useSubmit } from "@remix-run/react";
import confetti from "canvas-confetti";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { STEPS } from "~/utils/types";
import { FileUploader } from "./file-uploader";

export function FileUpload({
  setStep,
  setOpen,
  submit,
}: {
  setStep: (step: string) => void;
  setOpen: (open: boolean) => void;
  submit: ReturnType<typeof useSubmit>;
}) {
  const { chatbotId } = useParams();
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // the fetcher gets canceled because the component unmounts ???
  // also if you close it manually (i.e. click outside of it) it gets cancelled

  const handleUpload = () => {
    if (files.length === 0) {
      setValidationError("Please select at least one file");
      fileRef.current?.focus();
      return;
    }

    setOpen(false);
    const formData = new FormData();
    const fileIds: Record<string, string> = {};

    files.forEach((file) => {
      const fileId = createId();
      fileIds[file.name] = fileId;
      formData.append("files", file);
    });

    formData.append("intent", "parseFiles");
    formData.append("fileIds", JSON.stringify(fileIds));

    submit(formData, {
      method: "POST",
      action: `/chatbots/${chatbotId}/data?index`,
      encType: "multipart/form-data",
      navigate: false,
      fetcherKey: `${chatbotId}-${Date.now()}`,
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload files</DialogTitle>
        <DialogDescription>
          Drag and drop your files here or click to browse.
        </DialogDescription>
      </DialogHeader>
      <FileUploader
        ref={fileRef}
        validationError={validationError}
        setValidationError={setValidationError}
        maxFiles={8}
        maxSize={8 * 1024 * 1024}
        onValueChange={setFiles}
      />
      {validationError ? (
        <p
          className="pt-1 text-red-500 text-sm font-medium leading-none"
          id="vaidation-error"
        >
          {validationError}
        </p>
      ) : null}
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
          <Button onClick={handleUpload}>Next</Button>
        </div>
      </DialogFooter>
    </>
  );
}
