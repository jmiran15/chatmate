import { Link, useMatches } from "@remix-run/react";
import { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    path: string;
    icon: LucideIcon;
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  const matches = useMatches();

  function isActive(path: string) {
    return matches.filter((match) =>
      match.handle ? match.handle.breadcrumb === path : false,
    ).length;
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  key={`${link.title}-`}
                  to={link.path}
                  className={cn(
                    buttonVariants({
                      variant: isActive(link.path) ? "default" : "ghost",
                      size: "icon",
                    }),
                    isActive(link.path) &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
                    "h-9 w-9",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={index}
              to={link.path}
              className={cn(
                buttonVariants({
                  variant: isActive(link.path) ? "default" : "ghost",
                  size: "sm",
                }),
                isActive(link.path) &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start",
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
