import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { BarList } from "./barlist";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useState } from "react";

const countryData = [
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
];

export default function VisitorsBarlist({
  countryData,
  browserData,
  deviceData,
}: {
  countryData: {
    country: string;
    country_code: string;
    count: number;
  }[];
  browserData: {
    browser: string;
    count: number;
  }[];
  deviceData: {
    device: string;
    count: number;
  }[];
}) {
  const [tab, setTab] = useState<"country" | "browser" | "device">("country");

  const countries = countryData.map((country) => ({
    name: country.country,
    value: country.count,
    img: (
      <img
        className="h-full w-full"
        alt={country.country_code}
        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country.country_code}.svg`}
      />
    ),
  }));

  const browsers = browserData.map((browser) => ({
    name: browser.browser,
    value: browser.count,
  }));

  const devices = deviceData.map((device) => ({
    name: device.device || "unknown",
    value: device.count,
  }));

  const onTabChange = (value) => {
    setTab(value);
  };

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
          <Tabs defaultValue="country" onValueChange={onTabChange} value={tab}>
            <TabsList>
              <TabsTrigger value="country">Country</TabsTrigger>
              <TabsTrigger value="browser">Browser</TabsTrigger>
              <TabsTrigger value="device">Device</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "country" ? (
          <BarList
            data={countries}
            showAnimation={true}
            onValueChange={console.log}
          />
        ) : null}
        {tab === "browser" ? (
          <BarList
            data={browsers}
            showAnimation={true}
            onValueChange={console.log}
          />
        ) : null}
        {tab === "device" ? (
          <BarList
            data={devices}
            showAnimation={true}
            onValueChange={console.log}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
