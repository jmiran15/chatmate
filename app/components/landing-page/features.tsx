import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

import rag from "../../media/Documents.gif";
import custimze from "../../media/Advanced customization.gif";
import fineTune from "../../media/Chat bot.gif";
import { useEffect, useRef, useState } from "react";

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: "SOTA document retrieval",
    description:
      "Your chatbot uses the latest in RAG technology to provide accurate and fast information to your customers.",
    image: rag,
  },
  {
    title: "Customizable widget",
    description:
      "Customize your chatbot widget to match your brand and website design. Add starter messages, example questions, and more.",
    image: custimze,
  },
  {
    title: "Fine-tuned LLM",
    description:
      "Our fine-tuned LLM actively engages with your customers and increases conversion rates by addressing their pain points.",
    image: fineTune,
  },
];

const featureList: string[] = [
  "Customizable widget",
  "Fine-tuned LLM",
  "SOTA document retrieval",
  "Easy website integration",
  "Intro messages",
  "Sample questions",
  "PDF upload",
];

export const Features = () => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleImages((prevVisibleImages) =>
              new Set(prevVisibleImages).add(
                entry.target.getAttribute("data-src")!,
              ),
            );
          }
        });
      },
      { threshold: 0.5 },
    );

    const images = document.querySelectorAll(".feature-image");
    images.forEach((img) => observer.current!.observe(img));

    return () => {
      observer.current!.disconnect();
    };
  }, []);

  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Many{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Great Features
        </span>
      </h2>

      <div className="flex flex-wrap md:justify-center gap-4">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge variant="secondary" className="text-sm">
              {feature}
            </Badge>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>{" "}
            <CardFooter>
              <img
                data-src={image}
                src={visibleImages.has(image) ? image : "placeholder.jpg"}
                alt="About feature"
                className="feature-image w-[200px] lg:w-[300px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
