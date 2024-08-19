import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { buttonVariants } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>How to install</CardTitle>
        <CardDescription>
          Looking for instructions on how to install your chatbot in popular
          frameworks? See the steps below.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter>
        <Link
          to="mailto:jonathan@chatmate.so"
          className={cn(buttonVariants({ variant: "link" }), "p-0 h-0")}
        >
          Not sure how to install? Contact us
        </Link>
      </CardFooter>
    </Card>
  );
}
