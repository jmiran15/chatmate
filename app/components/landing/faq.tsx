import { Container } from "./container";

const faqs = [
  [
    {
      question: "What is Chatmate?",
      answer:
        "Chatmate is an advanced chatbot creation tool that enables website owners to embed a chatbot powered by large language models, like gpt-4, into their websites. It's designed to respond to user inquiries, proactively engage, and address their concerns. This makes Chatmate a powerful tool for your customer support.",
    },
    {
      question: "Is Chatmate free?",
      answer:
        "Yes, Chatmate is completely free to use. We believe in providing powerful chatbot technology accessible to all website owners, regardless of their budget. This allows even small and medium-sized enterprises to leverage the benefits of advanced chatbot features without cost.",
    },
    {
      question: "How can I set up Chatmate on my website?",
      answer:
        "Setting up Chatmate on your website is straightforward. You simply need to provide the URL of your website or upload documents containing your website's information. After customization, you will receive code that you can embed into your website. This process is designed to be user-friendly, requiring minimal technical expertise.",
    },
  ],
  [
    {
      question: "Do I need to know how to code?",
      answer:
        "No, Chatmate is a completely no-code customer support chatbot tool. You can create and modify your chatbot entirely through our user-friendly UI. Once you are finished you can simply embed a few lines of code into your existing website.",
    },
    {
      question:
        "Can I use Chatmate if my website is on Webflow, Wix, Framer, Wordpress, Shopify, etc…?",
      answer:
        "Yes, you can embed Chatmate on any platform that allows you to add custom code to your website. If you face any troubles while embedding, or have questions, feel free to contact us at chatmate.dev@gmail.com",
    },
    {
      question: "Can Chatmate be customized to match my website’s style?",
      answer:
        "Absolutely! Chatmate offers extensive customization options to ensure the chatbot seamlessly blends with your website's style. You can modify colors, starter messages, follow-up questions, and more, to align the chatbot's appearance and behavior with your brand identity and website aesthetics.",
    },
  ],
  [
    {
      question:
        "What kind of support does Chatmate offer if I encounter issues?",
      answer:
        "For any issues or queries, you can reach us at chatmate.dev@gmail.com, and our team will assist you promptly. We are committed to ensuring a smooth experience with Chatmate and are always ready to help with any challenges you may face.",
    },
    {
      question: "What kind of data can I connect my chatbot to?",
      answer:
        "Chatmate allows you to connect your chatbot to your website directly or upload files. We support txt, eml, msg, xml, html, md, rst, json, rtf, jpeg, png, doc, docx, ppt, pptx, pdf, odt, epub, csv, tsv, xlsx, and gz files. There is no limit on data uploads.",
    },
  ],
];

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      {/* <img
        className="absolute left-1/2 top-0 max-w-none -translate-y-1/4 translate-x-[-30%]"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
      /> */}
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            If you can’t find what you’re looking for, email our support team at
            chatmate.dev@gmail.com
          </p>
        </div>
        <ul className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
