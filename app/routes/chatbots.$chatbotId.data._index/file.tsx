import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FileUploader } from "./file-uploader";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  useParams,
  useFetcher,
  useActionData,
  useSubmit,
} from "@remix-run/react";
import { STEPS } from "~/utils/types";

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

  // the fetcher gets canceled because the component unmounts ???
  // also if you close it manually (i.e. click outside of it) it gets cancelled

  const handleUpload = () => {
    setOpen(false);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("intent", "parseFiles");

    submit(formData, {
      method: "POST",
      action: `/chatbots/${chatbotId}/data?index`,
      encType: "multipart/form-data",
      navigate: false,
      fetcherKey: `${chatbotId}-${Date.now()}`,
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
        maxFiles={8}
        maxSize={8 * 1024 * 1024}
        onValueChange={setFiles}
      />
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
