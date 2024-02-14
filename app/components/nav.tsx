import { Link, useMatches } from "@remix-run/react";
import { LucideIcon, Menu } from "lucide-react";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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
  const [isOpen, setIsOpen] = useState<boolean>(false);

  function isActive(path: string) {
    return matches.filter((match) =>
      match.handle ? match.handle.breadcrumb === path : false,
    ).length;
  }

  return (
    // need to make the grid change to 2 col when on mobile
    <div className="md:col-span-1 border-b border-gray-200">
      {/* mobile */}
      <span className="md:hidden container h-14 px-4 w-screen flex justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="px-2">
            <Menu
              className="flex md:hidden h-5 w-5"
              onClick={() => setIsOpen(true)}
            >
              <span className="sr-only">Menu Icon</span>
            </Menu>
          </SheetTrigger>

          <SheetContent side={"left"}>
            {/* <SheetHeader>
              <SheetTitle className="font-bold text-xl">
                The tab selected
              </SheetTitle>
            </SheetHeader> */}
            <nav className="flex flex-col justify-center items-start gap-2 mt-4">
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
                    "w-full",
                  )}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </span>
      <div className="hidden md:flex flex-col gap-1 p-2 border-r border-gray-200 md:h-full">
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
    </div>
  );
}
