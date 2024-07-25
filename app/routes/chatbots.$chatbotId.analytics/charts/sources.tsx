import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { BarList } from "./barlist";

const chartData = [
  {
    name: "Chatmate.so",
    value: 301,
    href: "https://chatmate.so",
  },
  {
    name: "Chatmate.so Blog",
    value: 53,
    href: "https://chatmate.so/blog",
  },
  {
    name: "Chatmate.so Pricing",
    value: 42,
    href: "https://chatmate.so/pricing",
  },
  {
    name: "Chatmate.so Documentation",
    value: 32,
    href: "https://chatmate.so/docs",
  },
  {
    name: "Chatmate.so API",
    value: 20,
    href: "https://chatmate.so/api",
  },
  {
    name: "Chatmate.so Support",
    value: 15,
    href: "https://chatmate.so/support",
  },
  {
    name: "Chatmate.so Dashboard",
    value: 11,
    href: "https://chatmate.so/dashboard",
  },
  {
    name: "Chatmate.so Chatbot",
    value: 8,
    href: "https://chatmate.so/chatbot",
  },
  {
    name: "Chatmate.so Login",
    value: 5,
    href: "https://chatmate.so/login",
  },
  {
    name: "Chatmate.so Signup",
    value: 3,
    href: "https://chatmate.so/signup",
  },
  {
    name: "Chatmate.so Contact",
    value: 2,
    href: "https://chatmate.so/contact",
  },
  {
    name: "Chatmate.so About",
    value: 1,
    href: "https://chatmate.so/about",
  },
  {
    name: "Chatmate.so Careers",
    value: 1,
    href: "https://chatmate.so/careers",
  },
  {
    name: "Chatmate.so Terms",
    value: 1,
    href: "https://chatmate.so/terms",
  },
  {
    name: "Chatmate.so Privacy",
    value: 1,
    href: "https://chatmate.so/privacy",
  },
  {
    name: "Chatmate.so Cookies",
    value: 1,
    href: "https://chatmate.so/cookies",
  },
  {
    name: "Chatmate.so Sitemap",
    value: 1,
    href: "https://chatmate.so/sitemap",
  },
  {
    name: "Chatmate.so Status",
    value: 1,
    href: "https://chatmate.so/status",
  },
];

export default function Sources() {
  return (
    <Card className="w-full">
      <CardHeader className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium leading-none">Sources</div>
          <div>
            <div className="flex gap-2 items-center text-secondary leading-none">
              <div className="text-sm text-muted-foreground leading-none">
                13 referrers
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
