import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "What is Chatmate?",
    answer:
      "Chatmate is an advanced chatbot creation tool that enables website owners to embed a chatbot powered by large language models, like gpt-3.5-turbo, into their websites. It's designed to not only respond to user inquiries but also proactively engage with visitors, addressing their concerns and guiding them towards becoming customers. This makes Chatmate a powerful tool for increasing website conversion rates.",
    value: "item-1",
  },
  {
    question: "How does Chatmate differ from other chatbots?",
    answer:
      "Unlike standard chatbots that mainly answer user queries, Chatmate excels in actively engaging users. It's designed to interact with potential customers, understand their pain points, and persuasively address reasons they might hesitate to use a service. This proactive approach in customer engagement sets Chatmate apart, making it a robust tool for boosting conversion rates on websites.",
    value: "item-2",
  },
  {
    question: "How can I set up Chatmate on my website?",
    answer:
      "Setting up Chatmate on your website is straightforward. You simply need to provide the URL of your website or upload documents containing your website's information. After customization, you will receive a code for an iframe, which you can then embed into your website's code. This process is designed to be user-friendly, requiring minimal technical expertise.",
    value: "item-3",
  },
  {
    question: "Can Chatmate be customized to match my website’s style?",
    answer:
      "Absolutely! Chatmate offers extensive customization options to ensure the chatbot seamlessly blends with your website's style. You can modify colors, starter messages, example questions, and more, to align the chatbot's appearance and behavior with your brand identity and website aesthetics.",
    value: "item-4",
  },
  {
    question: "What kind of support does Chatmate offer if I encounter issues?",
    answer:
      "For any issues or queries, you can reach us at chatmate.dev@gmail.com, and our team will assist you promptly. We are committed to ensuring a smooth experience with Chatmate and are always ready to help with any challenges you may face.",
    value: "item-5",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Questions
        </span>
      </h2>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          href="mailto:chatmate.dev@gmail.com"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
