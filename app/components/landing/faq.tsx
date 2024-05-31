import { Link } from "@remix-run/react";
import { buttonVariants } from "../ui/button";
import { Container } from "./container";
import H2 from "./h2";
import H3 from "./h3";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { cn } from "~/lib/utils";

const faqs = [
  {
    question: "What is Chatmate?",
    answer:
      "Chatmate is an advanced chatbot creation tool that enables website owners to embed a chatbot powered by large language models, like gpt-4, into their websites. It's designed to respond to user inquiries, proactively engage, and address their concerns. This makes Chatmate a powerful tool for your customer support.",
  },
  {
    question: "How can I set up Chatmate on my website?",
    answer:
      "Setting up Chatmate on your website is straightforward. You simply need to provide the URL of your website or upload documents containing your website's information. After customization, you will receive code that you can embed into your website. This process is designed to be user-friendly, requiring minimal technical expertise.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "No, Chatmate is a completely no-code customer support chatbot tool. You can create and modify your chatbot entirely through our user-friendly UI. Once you are finished you can simply embed a few lines of code into your existing website.",
  },

  {
    question:
      "Can I use Chatmate if my website is on Webflow, Wix, Framer, Wordpress, Shopify, etc…?",
    answer:
      "Yes, you can embed Chatmate on any platform that allows you to add custom code to your website. If you face any troubles while embedding, or have questions, feel free to contact us at help@chatmate.so",
  },
  {
    question: "Can Chatmate be customized to match my website’s style?",
    answer:
      "Absolutely! Chatmate offers extensive customization options to ensure the chatbot seamlessly blends with your website's style. You can modify colors, starter messages, follow-up questions, and more, to align the chatbot's appearance and behavior with your brand identity and website aesthetics.",
  },
  {
    question: "What kind of support does Chatmate offer if I encounter issues?",
    answer:
      "For any issues or queries, you can reach us at help@chatmate.so, and our team will assist you promptly. We are committed to ensuring a smooth experience with Chatmate and are always ready to help with any challenges you may face.",
  },

  {
    question: "What kind of data can I connect my chatbot to?",
    answer:
      "Chatmate allows you to connect your chatbot to your website directly or upload files. We support txt, eml, msg, xml, html, md, rst, json, rtf, jpeg, png, doc, docx, ppt, pptx, pdf, odt, epub, csv, tsv, xlsx, and gz files. There is no limit on data uploads.",
  },
];

export function Faqs() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="overflow-hidden">
      <Container className="relative">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <H2 className="text-primary">Frequently asked questions</H2>
            <H3 className="text-primary">
              Have a question? We have answers. If you can’t find what you’re
              looking for, email our support team at{" "}
              <Link
                to="mailto:help@chatmate.so"
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "inline-block text-xl p-0",
                )}
              >
                help@chatmate.so
              </Link>
            </H3>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, faqIndex) => (
              <AccordionItem key={faqIndex} value={faqIndex.toString()}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
