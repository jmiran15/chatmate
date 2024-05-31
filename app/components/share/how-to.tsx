import { Link } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { buttonVariants } from "../ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { cn } from "~/lib/utils";

const PLATFORMS = [
  {
    platform: "Webflow",
    steps: [
      "Go to your Webflow dashboard",
      `Navigate to your project settings`,
      `Click on the '<strong>Custom Code</strong>' tab`,
      `Paste the code snippet in the '<strong>Head Code</strong>' section`,
      `Save changes and publish your site`,
    ],
  },
  {
    platform: "Wix",
    steps: [
      "Go to your Wix dashboard",
      `Click on '<strong>Settings</strong>'`,
      `Select '<strong>Tracking & Analytics</strong>' from the dropdown menu`,
      `Click on '<strong>+ New Tool</strong>' and select '<strong>Custom</strong>'`,
      `Paste the code snippet in the '<strong>Paste the code snippet here</strong>' section`,
      "Save changes and publish your site",
    ],
  },
  {
    platform: "Framer",
    steps: [
      "Go to your Framer dashboard",
      `Navigate to your project settings`,
      `Click on the '<strong>Custom Code</strong>' tab`,
      `Paste the code snippet in the '<strong>Head Code</strong>' section`,
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
      `Paste the code snippet just before the closing </head> tag`,
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
          to="mailto:help@chatmate.so"
          className={cn(buttonVariants({ variant: "link" }), "p-0 h-0")}
        >
          Not sure how to install? Contact us
        </Link>
      </CardFooter>
    </Card>
  );
}
