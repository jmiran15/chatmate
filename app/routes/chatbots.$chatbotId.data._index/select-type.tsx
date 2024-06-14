import { useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CgWebsite, CgFile, CgFormatText } from "react-icons/cg";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { STEPS } from "~/utils/types";
// import {
//   SiZendesk,
//   SiConfluence,
//   SiJira,
//   SiNotion,
//   SiGoogledrive,
//   SiGithub,
// } from "react-icons/si";
// import { FaSalesforce } from "react-icons/fa";

const DataTypes = [
  {
    value: STEPS.WEBSITE,
    label: "Website",
    icon: CgWebsite,
  },
  {
    value: STEPS.FILE,
    label: "File",
    icon: CgFile,
  },
  {
    value: STEPS.BLANK,
    label: "Blank",
    icon: CgFormatText,
  },
  // {
  //   value: "zendesk",
  //   label: "Zendesk",
  //   icon: SiZendesk,
  // },
  // {
  //   value: "salesforce",
  //   label: "Salesforce",
  //   icon: FaSalesforce,
  // },
  // {
  //   value: "confluence",
  //   label: "Confluence",
  //   icon: SiConfluence,
  // },
  // {
  //   value: "jira",
  //   label: "Jira",
  //   icon: SiJira,
  // },
  // {
  //   value: "notion",
  //   label: "Notion",
  //   icon: SiNotion,
  // },
  // {
  //   value: "google-drive",
  //   label: "Google Drive",
  //   icon: SiGoogledrive,
  // },
  // {
  //   value: "github",
  //   label: "Github",
  //   icon: SiGithub,
  // },
];

export default function SelectType({
  setStep,
}: {
  setStep: (step: string) => void;
}) {
  // const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState("website");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select Data Type</DialogTitle>
        <DialogDescription>
          Select the type of data you want to upload to the chatbot.
        </DialogDescription>
      </DialogHeader>
      <RadioGroup
        defaultValue={type}
        onValueChange={setType}
        className="grid grid-cols-3 gap-4"
      >
        {DataTypes.map((dataType) => (
          <div key={dataType.value}>
            <RadioGroupItem
              value={dataType.value}
              id={dataType.value}
              className="peer sr-only"
              aria-label={dataType.label}
            />
            <Label
              htmlFor={dataType.value}
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <dataType.icon className="mb-3 h-6 w-6" />
              {dataType.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <DialogFooter>
        <Button onClick={() => setStep(type)}>Next</Button>
      </DialogFooter>
    </>
  );
}
