import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Link, Brush, Share } from "lucide-react";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

// how it works
// connect your website, we scrape automatically icon - globe
// test your chatbot, icon - chat
// add the iframe to your website icon - iframe
// track your leads and conversions icon - chart

const features: FeatureProps[] = [
  {
    icon: <Link size={40} color="#f97316" />,
    title: "Connect",
    description:
      "Connect your website or manually upload files as a data source for your chatbot to learn from.",
  },
  {
    icon: <Brush size={40} color="#f97316" />,
    title: "Customize",
    description:
      "Test your chatbot and customize your chatbot widget to match your brand and website design.",
  },
  {
    icon: <Share size={40} color="#f97316" />,
    title: "Embed",
    description:
      "Add the iframe to your website and start engaging with your visitors.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="howItWorks" className="container text-center py-24 sm:py-32">
      <h2 className="text-3xl md:text-4xl font-bold ">
        How It{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Works{" "}
        </span>
        Step-by-Step Guide
      </h2>
      <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
        Connect your website, customize your widget UI to your liking, and add
        it to your website. It's that simple!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card key={title} className="bg-muted/50">
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
