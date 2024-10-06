import { Sparkles, Upload, Zap } from "lucide-react";
import Features from "./features-vertical";
import Section from "./section";

// Add your data.

// Connect your website or upload your data to our secure platform. We support various file formats and data types to ensure a seamless integration with your existing systems.

// Customize your chat widget.

// Customize your chatbot widget with your colors, logo, theme, icons, and more. Personalize the chatbot with custom welcome messages and starter questions to engage users.

// Install it on your site.

// You can install the chatbot widget on your website by copying our short code snippet or following our installation instructions for various platforms (Webflow, Wix, Shopify, and more).

const data = [
  {
    id: 1,
    title: "1. Add your data",
    video: "/how-to-data.mp4",
    content:
      "Connect your website or upload your data to our secure platform. We support various file formats and data types to ensure a seamless integration with your existing systems.",
    icon: <Upload className="w-6 h-6 text-orange-500" />,
  },
  {
    id: 2,
    title: "2. Customize your chat widget",
    content:
      "Customize your chatbot widget with your colors, logo, theme, icons, and more. Personalize the chatbot with custom welcome messages and starter questions to engage users.",
    video: "/how-to-customize.mp4",
    icon: <Zap className="w-6 h-6 text-orange-500" />,
  },
  {
    id: 3,
    title: "3. Install it on your site",
    content:
      "You can install the chatbot widget on your website by copying our short code snippet or following our installation instructions for various platforms (Webflow, Wix, Shopify, and more).",
    video: "/how-to-install.mp4",
    icon: <Sparkles className="w-6 h-6 text-orange-500" />,
  },
];

export default function HowItWorks() {
  return (
    <Section title="How it works" subtitle="Just 3 steps to get started">
      <Features data={data} />
    </Section>
  );
}
