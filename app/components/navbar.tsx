import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

import { Button, buttonVariants } from "./ui/button";
import { Menu } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Form, Link, NavLink } from "@remix-run/react";
import { Icons } from "./icons";
import { useOptionalUser } from "~/utils";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "#features",
    label: "Features",
  },
  {
    href: "#testimonials",
    label: "Testimonials",
  },
  {
    href: "#pricing",
    label: "Pricing",
  },
  {
    href: "#faq",
    label: "FAQ",
  },
];

export const Navbar = () => {
  const user = useOptionalUser();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex">
            <NavLink to="/" className="mr-6 flex items-center space-x-2">
              <Icons.logo className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">Chatmate</span>
            </NavLink>
          </NavigationMenuItem>

          {/* mobile */}
          <span className="flex md:hidden">
            <ModeToggle />

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
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl">
                    Chatmate
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                  {!user ? (
                    routeList.map(({ href, label }: RouteProps) => (
                      <NavLink
                        key={label}
                        to={href}
                        onClick={() => setIsOpen(false)}
                        className={buttonVariants({ variant: "ghost" })}
                      >
                        {label}
                      </NavLink>
                    ))
                  ) : (
                    <></>
                  )}
                  {user ? (
                    <>
                      <Link
                        to="/chatbots"
                        className={buttonVariants({ variant: "outline" })}
                      >
                        View your chatbots
                      </Link>
                      <Form action="/logout" method="post">
                        <Button type="submit" variant="destructive">
                          Logout
                        </Button>
                      </Form>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className={buttonVariants({ variant: "outline" })}
                      >
                        Log In
                      </Link>

                      <Link to="/join" className={buttonVariants()}>
                        Get Started
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </span>

          {/* desktop */}
          {!user ? (
            <nav className="hidden md:flex gap-2">
              {routeList.map((route: RouteProps, i) => (
                <NavLink
                  to={route.href}
                  key={i}
                  className={`text-sm ${buttonVariants({
                    variant: "ghost",
                  })}`}
                >
                  {route.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <></>
          )}

          <div className="hidden md:flex gap-2">
            {user ? (
              <>
                <Link
                  to="/chatbots"
                  className={buttonVariants({ variant: "outline" })}
                >
                  View your chatbots
                </Link>
                <Form action="/logout" method="post">
                  <Button type="submit" variant="destructive">
                    Logout
                  </Button>
                </Form>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Log In
                </Link>

                <Link to="/join" className={buttonVariants()}>
                  Get Started
                </Link>
              </>
            )}

            <ModeToggle />
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
