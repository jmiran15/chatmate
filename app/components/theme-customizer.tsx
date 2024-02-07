import { CheckIcon, ResetIcon } from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";
import { useConfig } from "~/hooks/use-config";
import { ThemeWrapper } from "./theme-wrapper";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import { themes } from "~/registry/themes";
import { useEffect, useState } from "react";

export default function Customizer() {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useConfig();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
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
            Pick a style and color for your components.
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
      <div className="flex flex-1 flex-col space-y-4 md:space-y-6">
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
  );
}
