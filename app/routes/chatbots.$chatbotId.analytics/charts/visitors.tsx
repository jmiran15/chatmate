import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { BarList } from "./barlist";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ReactCountryFlag from "react-country-flag";

const chartData = [
  {
    name: "United States",
    value: 91,
    img: (
      <img
        className="h-full w-full"
        alt="DE"
        src="https://purecatamphetamine.github.io/country-flag-icons/3x2/DE.svg"
      />
    ),
  },
  {
    name: "India",
    value: 45,
  },
  {
    name: "United Kingdom",
    value: 23,
  },
  {
    name: "Canada",
    value: 12,
  },
  {
    name: "Australia",
    value: 9,
  },
  {
    name: "Germany",
    value: 8,
  },
  {
    name: "France",
    value: 7,
  },
  {
    name: "Netherlands",
    value: 6,
  },
  {
    name: "Brazil",
    value: 5,
  },
  {
    name: "Italy",
    value: 4,
  },
  {
    name: "Spain",
    value: 3,
  },
  {
    name: "Japan",
    value: 2,
  },
  {
    name: "China",
    value: 1,
  },
  {
    name: "Russia",
    value: 1,
  },
  {
    name: "South Korea",
    value: 1,
  },
  {
    name: "Mexico",
    value: 1,
  },
  {
    name: "Indonesia",
    value: 1,
  },
  {
    name: "Turkey",
    value: 1,
  },
  {
    name: "Saudi Arabia",
    value: 1,
  },
  {
    name: "South Africa",
    value: 1,
  },
  {
    name: "Nigeria",
    value: 1,
  },
  {
    name: "Egypt",
    value: 1,
  },
  {
    name: "Kenya",
    value: 1,
  },
  {
    name: "Ghana",
    value: 1,
  },
  {
    name: "Uganda",
    value: 1,
  },
  {
    name: "Morocco",
    value: 1,
  },
  {
    name: "Algeria",
    value: 1,
  },
  {
    name: "Tunisia",
    value: 1,
  },
  {
    name: "Libya",
    value: 1,
  },
  {
    name: "Ethiopia",
    value: 1,
  },
  {
    name: "Sudan",
    value: 1,
  },
];

export default function VisitorsBarlist() {
  return (
    <Card className="w-full">
      <CardHeader className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Visitors</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                30 countries
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Tabs defaultValue="country">
            <TabsList>
              <TabsTrigger value="country">Country</TabsTrigger>
              <TabsTrigger value="browser">Browser</TabsTrigger>
              <TabsTrigger value="device">Device</TabsTrigger>
            </TabsList>
          </Tabs>
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
