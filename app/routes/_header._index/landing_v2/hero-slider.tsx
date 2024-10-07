import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";

const features = [
  {
    name: "Inbox",
    description:
      "Analyze and manage all your chats. Jump into the conversation whenever you like.",
    image: "/primary-inbox.webp",
  },
  {
    name: "Forms",
    description:
      "Create and use forms in your flows to collect qualified leads.",
    image: "/primary-forms.webp",
  },
  {
    name: "Flows",
    description:
      "Take full control of the user's chat. Create custom chat flows.",
    image: "/primary-flows.webp",
  },
  {
    name: "Analytics",
    description: "Track the performance of your chatbot.",
    image: "/primary-analytics.webp",
  },
];

const ease = [0.16, 1, 0.3, 1];

export default function HeroSlider() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <motion.div
      className="w-full max-w-screen-lg mx-auto px-4 mt-8 sm:mt-12"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 1, ease }}
    >
      <motion.div
        className="flex flex-wrap justify-center gap-2 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease }}
      >
        {features.map((feature, index) => (
          <Badge
            key={feature.name}
            variant={activeFeature === index ? "default" : "outline"}
            className="cursor-pointer text-sm px-3 py-1"
            onClick={() => setActiveFeature(index)}
          >
            {feature.name}
          </Badge>
        ))}
      </motion.div>
      <motion.div
        className="text-center mb-4 h-16 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={activeFeature}
            // className="text-muted-foreground text-sm sm:text-base"
            className="mx-auto max-w-5xl text-center text-lg leading-7 text-muted-foreground sm:text-xl sm:leading-9 text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease }}
          >
            {features[activeFeature].description}
          </motion.p>
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="relative w-full"
        // style={{ paddingBottom: "56.25%" }} // 16:9 aspect ratio
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8, ease }}
      >
        <img
          src={features[activeFeature].image}
          alt={features[activeFeature].name}
          loading="lazy"
          decoding="async"
          className="object-contain rounded-t-lg border-l border-r border-t"
          //   className="absolute inset-0 w-full h-full object-contain rounded-t-lg border-l border-r border-t"
          style={{
            boxShadow: "0px -4px 80px 0px rgba(0, 0, 0, 0.15)",
            clipPath: "inset(-80px -80px 0px -80px)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
