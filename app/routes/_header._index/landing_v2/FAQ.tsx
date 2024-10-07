import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import Section from "./section";

const faqs = [
  {
    question: "What is Chatmate?",
    answer: (
      <span>
        Chatmate is an advanced chatbot creation tool that enables businesses to
        embed a chatbot powered by large language models, like gpt-4o, into
        their websites. It's designed to respond to user inquiries, proactively
        engage, and address their concerns. This makes Chatmate a powerful tool
        for your customer support.
      </span>
    ),
  },
  {
    question: "What kind of data can I connect my chatbot to?",
    answer: (
      <span>
        Chatmate allows you to{" "}
        <strong>connect your chatbot to your website</strong> directly or upload
        files. We support{" "}
        <strong>
          txt, eml, msg, xml, html, md, rst, json, rtf, jpeg, png, doc, docx,
          ppt, pptx, pdf, odt, epub, csv, tsv, xlsx, and gz files
        </strong>
        . We also allow you to{" "}
        <strong>write your knowledge base in Chatmate</strong>. There is no
        limit on data uploads; you can connect as many websites and/or upload as
        many files as you would like on all of our tiers.
      </span>
    ),
  },
  {
    question: "Will the Chatmate widget affect my website’s SEO?",
    answer: (
      <span>
        Not at all! Our website widget is bundled into and extremely small
        script which should not affect the performance or SEO of your website.
      </span>
    ),
  },
  {
    question:
      "How does Chatmate compare to Chatbase, Sitegpt, or similar tools?",
    answer: (
      <span>
        First off, we love these tools. We've drawn a lot of inspiration from
        their concepts and the people behind them.
        <br />
        <br />
        The main difference is that we also offer the ability to “jump in” to
        any chat whenever a user requests it (by explicitly stating they would
        like to talk to a human), when the AI detects it cannot properly answer
        a user’s query, or whenever you would like to takeover manually. We also
        offer other features, such as a custom lead form builder and flow
        builder which allow you to take more control of your chatbot’s behavior.
      </span>
    ),
  },
  {
    question: "Does Chatmate have a free plan?",
    answer: (
      <span>
        Unfortunately, we do not offer a free plan. However, we do offer a free
        7-day trial on all of our plans. If there is anything you would like to
        see from Chatmate before signing up for a free trial, please do not
        hesitate to reach out at{" "}
        <strong>
          <a href="mailto:jonathan@chatmate.so">jonathan@chatmate.so</a>
        </strong>{" "}
        and we can setup a quick demo.
      </span>
    ),
  },
  {
    question: "How can we contact you?",
    answer: (
      <span>
        You can reach out to us at{" "}
        <strong>
          <a href="mailto:jonathan@chatmate.so">jonathan@chatmate.so</a>
        </strong>{" "}
        or chat with our widget.
      </span>
    ),
  },
];

export default function FAQ() {
  return (
    <Section id="faq" title="FAQ" subtitle="Frequently asked questions">
      <div className="mx-auto my-12 md:max-w-[800px]">
        <Accordion
          type="single"
          collapsible
          className="flex w-full flex-col items-center justify-center space-y-2"
        >
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={faq.question}
              className="w-full border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <h4 className="mb-12 text-center text-sm font-medium tracking-tight text-foreground/80">
        Still have questions? Email us at{" "}
        <a href={`mailto:jonathan@chatmate.so`} className="underline">
          jonathan@chatmate.so
        </a>
      </h4>
    </Section>
  );
}
