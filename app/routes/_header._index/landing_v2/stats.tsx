import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { Card, CardContent } from "~/components/ui/card";

const stats = [
  { value: 23, label: "Higher conversion rate" },
  { value: 18, label: "Faster ticker resolution" },
  { value: 71, label: "Successful resolution rate" },
];

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="stats" ref={ref}>
      <div className="relative container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center space-y-4 pb-6 mx-auto">
          <h2 className="text-sm text-orange-500 font-mono font-medium tracking-wider uppercase">
            Stats
          </h2>

          <h4 className="text-[42px] font-medium mb-2 text-balance max-w-3xl mx-auto tracking-tighter">
            Websites using our AI chatbot widget see
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <AnimatedCard
              key={index}
              value={stat.value}
              label={stat.label}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
interface AnimatedCardProps {
  value: number;
  label: string;
  isInView: boolean;
}

function AnimatedCard({ value, label, isInView }: AnimatedCardProps) {
  const spring = useSpring(0, { duration: 2000 });
  const displayValue = useTransform(spring, (current) =>
    Math.floor(current).toLocaleString(),
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-4 text-center">
        <motion.div
          className="text-4xl md:text-5xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span>{displayValue}</motion.span>
          {value > 1000 && "+"}
          {"%"}
        </motion.div>
        <div className="text-sm md:text-base text-muted-foreground">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
