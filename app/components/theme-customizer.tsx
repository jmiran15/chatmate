import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";
import { useConfig } from "~/hooks/use-config";
import { ThemeWrapper } from "./theme-wrapper";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import { themes } from "~/registry/themes";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";

export default function Customizer() {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useConfig();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ScrollArea className="flex-1 overflow-y-auto h-full">
      <ThemeWrapper
        defaultTheme="zinc"
        className="flex flex-col space-y-4 md:space-y-6 p-14"
      >
        <div className="flex items-start pt-4 md:pt-0">
          <div className="space-y-1 pr-2">
            <div className="font-semibold leading-none tracking-tight">
              Customize
            </div>
            <div className="text-xs text-muted-foreground">
              Customize the style of your chatbot widget.
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto rounded-[0.5rem]"
            onClick={() => {
              setConfig({
                ...config,
                theme: "zinc",
                radius: 0.5,
              });
            }}
          >
            <ResetIcon />
            <span className="sr-only">Reset</span>
          </Button>
        </div>

        {/* this stuff should be a fetcher, that submits on every update to anything */}
        {/* the chatbot just loads the appearance, which should revalidate whenever the action gets called */}
        <div className="flex flex-1 flex-col space-y-4 md:space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input type="text" name="name" id="name" placeholder="Name" />
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input id="picture" type="file" />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="intro">Intro messages</Label>
            <Textarea
              id="intro"
              placeholder="Enter your intro messages seperated by a comma"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              These messages will be shown when the chatbot is first opened.
            </p>
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="starter">Starter questions</Label>
            <Textarea
              id="starter"
              placeholder="Enter some starter questions seperated by a comma"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              These questions will be shown when the chatbot is first opened.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => {
                const isActive = config.theme === theme.name;

                return mounted ? (
                  <Button
                    variant={"outline"}
                    size="sm"
                    key={theme.name}
                    onClick={() => {
                      setConfig({
                        ...config,
                        theme: theme.name,
                      });
                    }}
                    className={cn(
                      "justify-start",
                      isActive && "border-2 border-primary",
                    )}
                    style={
                      {
                        "--theme-primary": `hsl(${theme?.activeColor["light"]})`,
                      } as React.CSSProperties
                    }
                  >
                    <span
                      className={cn(
                        "mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]",
                      )}
                    >
                      {isActive && <CheckIcon className="h-4 w-4 text-white" />}
                    </span>
                    {theme.label}
                  </Button>
                ) : (
                  <Skeleton className="h-8 w-full" key={theme.name} />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Radius</Label>
            <div className="grid grid-cols-5 gap-2">
              {["0", "0.3", "0.5", "0.75", "1.0"].map((value) => {
                return (
                  <Button
                    variant={"outline"}
                    size="sm"
                    key={value}
                    onClick={() => {
                      setConfig({
                        ...config,
                        radius: parseFloat(value),
                      });
                    }}
                    className={cn(
                      config.radius === parseFloat(value) &&
                        "border-2 border-primary",
                    )}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </ThemeWrapper>
    </ScrollArea>
  );
}
