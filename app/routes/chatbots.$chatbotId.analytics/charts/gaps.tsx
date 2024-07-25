import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { BarList } from "./barlist";

const chartData = [
  {
    name: "What are your business hours?",
    value: 4,
  },
  {
    name: "How can I track my order?",
    value: 3,
  },
  {
    name: "How do I reset my password?",
    value: 1,
  },
  {
    name: "How long does shipping take?",
    value: 1,
  },
];

export default function GapsBarlist() {
  return (
    <Card className="w-full">
      <CardHeader className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Unanswered Questions</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                4 common unanswered questions
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
