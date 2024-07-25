import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { BarList } from "./barlist";

const chartData = [
  {
    name: "How do I reset my password? How do I reset my password? How do I reset my password?",
    value: 15000,
  },
  {
    name: "What are your business hours?",
    value: 12000,
  },
  {
    name: "How can I track my order?",
    value: 11000,
  },
  {
    name: "What is your return/refund policy?",
    value: 10000,
  },
  {
    name: "How long does shipping take?",
    value: 8000,
  },
  {
    name: "Is there a warranty on this product?",
    value: 6000,
  },
  {
    name: "How do I cancel my subscription/acvalue?",
    value: 5000,
  },
  {
    name: "What payment methods do you accept?",
    value: 4000,
  },
  {
    name: "How do I contact a human representative?",
    value: 2500,
  },
  {
    name: "Is there a user manual or guide available?",
    value: 1500,
  },
];

export default function BattleFieldChart() {
  return (
    <Card className="w-full">
      <CardHeader className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">FAQ</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                4 frequently asked questions
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <BarList
          data={chartData}
          showAnimation={true}
          onValueChange={console.log}
        />
      </CardContent>
    </Card>
  );
}
