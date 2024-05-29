import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { Link, useMatches } from "@remix-run/react";
import { cn, isActive } from "~/lib/utils";
import { LucideIcon, Menu } from "lucide-react";
import { Icons } from "../icons";

interface RouteProps {
  path: string;
  title: string;
  icon?: LucideIcon;
}

export default function SidebarSheet({ routes }: { routes: RouteProps[] }) {
  const matches = useMatches();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Icons.logo className="h-6 w-6" />
            <span className="sr-only">Chatmate</span>
          </Link>

          {routes.map((link, index) => (
            <Link
              id={link.path}
              key={index}
              to={link.path}
              className={cn(
                isActive(matches, link.path)
                  ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                  : "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
              )}
            >
              {link.icon ? <link.icon className="h-5 w-5" /> : null}
              {link.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
