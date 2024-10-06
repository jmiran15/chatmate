import { BarChart3, Brain, FileText, LineChart } from "lucide-react";

import Features from "./features-horizontal";
import Section from "./section";

const data = [
  {
    id: 1,
    title: "Built-in Safeguards",
    content:
      "Your chatbot won't give your users false information about your business.",
    image: "/secondary-safeguards.webp",
    icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
  },
  {
    id: 2,
    title: "Collect Qualified Leads",
    content:
      "Collect leads with custom forms. Build out a flow to control when and how you send them.",
    image: "/secondary-qualified-lead.webp",
    icon: <Brain className="h-6 w-6 text-orange-500" />,
  },
  {
    id: 3,
    title: "Customize the AI",
    content:
      "You decide how the chatbot behaves. Tailor it to your brand's voice by modifying the system prompt and response length.",
    image: "/secondary-settings.webp",
    icon: <LineChart className="h-6 w-6 text-orange-500" />,
  },
  {
    id: 4,
    title: "Engage users",
    content:
      "Your chatbots will automatically send relevant follow-up questions, encouraging users to learn more about your product.",
    image: "/secondary-follow-ups.webp",
    icon: <FileText className="h-6 w-6 text-orange-500" />,
  },
];

export default function SecondaryFeatures() {
  return (
    <Section
      id="features"
      title="Features"
      subtitle="Maximize your chatbot's potential"
    >
      <Features linePosition="bottom" data={data} />
    </Section>
  );
}
