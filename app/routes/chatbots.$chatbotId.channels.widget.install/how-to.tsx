import { Link } from "@remix-run/react";
import { NonLinkCard } from "~/components/LinkCard";
import { LinkCardBody } from "~/components/LinkCardBody";
import { LinkCardHeader } from "~/components/LinkCardHeader";
import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { buttonVariants } from "../../components/ui/button";

const PLATFORMS = [
  {
    platform: "Webflow",
    steps: [
      "Go to your Webflow dashboard",
      `Navigate to your project settings`,
      `Click on the '<strong>Custom Code</strong>' tab`,
      `Paste the code snippet in the '<strong>Footer Code</strong>' section`,
      `Save changes and publish your site`,
    ],
  },
  {
    platform: "Wix",
    steps: [
      "Go to <strong>Settings</strong> in your site's dashboard.",
      "Click the <strong>Custom Code</strong> tab in the <strong>Advanced</strong> section.",
      "Click <strong>+ Add Custom Code</strong> at the top right.",
      "Paste the code snippet in the text box.",
      "Enter a name for your code.",
      "Selct the <strong>All pages</strong> option under <strong>Add Code to Pages</strong>.",
      "Choose <strong>Body - end</strong> under <strong>Place Code in</strong>.",
      "Click <strong>Apply</strong>.",
    ],
  },

  {
    platform: "Framer",
    steps: [
      "Go to your Framer dashboard",
      `Navigate to your project settings`,
      `Click on the '<strong>Custom Code</strong>' tab`,
      `Paste the code snippet in the <strong>End of body</strong> section`,
      `Save changes and publish your site`,
    ],
  },
  {
    platform: "Shopify",
    steps: [
      "Go to your Shopify dashboard",
      `Navigate to '<strong>Online Store</strong>' and then '<strong>Themes</strong>'`,
      `Click on '<strong>Actions</strong>' and select '<strong>Edit code</strong>'`,
      `Find the '<strong>theme.liquid</strong>' file and click to edit it`,
      `Paste the code snippet just before the closing </body> tag`,
      "Save changes and update your site",
    ],
  },
];

export default function HowTo() {
  return (
    <NonLinkCard className="w-full max-w-2xl">
      <div className="p-4 flex flex-col gap-4 items-start justify-start">
        <div className="flex flex-col gap-1">
          <LinkCardHeader title={"How to install"} tag={undefined} />
          <LinkCardBody>
            <span>
              Looking for instructions on how to install your chatbot in popular
              frameworks? See the steps below.
            </span>
          </LinkCardBody>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {PLATFORMS.map(({ platform, steps }) => (
            <AccordionItem key={platform} value={platform}>
              <AccordionTrigger>{platform}</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4">
                  Follow these steps to install your chatbot in {platform}.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  {steps.map((step) => (
                    <li key={step} dangerouslySetInnerHTML={{ __html: step }} />
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Link
          to="mailto:jonathan@chatmate.so"
          className={cn(buttonVariants({ variant: "link" }), "px-0")}
        >
          Not sure how to install? Contact us
        </Link>
      </div>
    </NonLinkCard>
  );
}
