import { Link, useMatches } from "@remix-run/react";
import { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./ui/button";

export function Nav({
  links,
}: {
  links: {
    title: string;
    path: string;
    icon: LucideIcon;
  }[];
}) {
  const matches = useMatches();

  function isActive(path: string) {
    return matches.filter((match) =>
      match.handle ? match.handle.breadcrumb === path : false,
    ).length;
  }

  return (
    <div className="col-span-1 flex flex-col gap-1 p-2 border-r border-gray-200 h-full">
      {links.map((link, index) => (
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
      ))}
    </div>
  );
}
