import { useState } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import visitorsEmptyImage from "~/images/visitors-empty.png";
import { EmptyState } from "../EmptyState";
import { BarList } from "./barlist";

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

  const isEmptyData =
    countries.length === 0 && browsers.length === 0 && devices.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="w-full flex flex-row items-center justify-between flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Visitors</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                {countries.length} countries
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
      <CardContent className="flex-grow">
        {isEmptyData ? (
          <EmptyState
            image={visitorsEmptyImage}
            title="No visitor data yet"
            description="Visitor information will appear here once your chatbot starts receiving traffic."
            className="h-full"
          />
        ) : (
          <>
            {tab === "country" && (
              <BarList
                data={countries}
                showAnimation={true}
                onValueChange={console.log}
              />
            )}
            {tab === "browser" && (
              <BarList
                data={browsers}
                showAnimation={true}
                onValueChange={console.log}
              />
            )}
            {tab === "device" && (
              <BarList
                data={devices}
                showAnimation={true}
                onValueChange={console.log}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
