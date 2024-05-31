import { Sheet, SheetContent } from "../ui/sheet";
import { Button } from "../ui/button";
import { Link, useLocation, useMatches, useParams } from "@remix-run/react";
import { cn, isActive } from "~/lib/utils";
import { LucideIcon, Menu } from "lucide-react";
import { Icons } from "../icons";
import { useEffect, useState } from "react";

interface RouteProps {
  path: string;
  title: string;
  icon?: LucideIcon;
  navigate?: boolean;
}

export default function SidebarSheet({
  routes,
  matches,
}: {
  routes: RouteProps[];
  matches: ReturnType<typeof useMatches>;
}) {
  const [open, setOpen] = useState(false);
  const { chatbotId } = useParams();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.hash, location.pathname]);

  if (typeof document === "undefined") {
    return;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Icons.logo className="h-6 w-6" />
            <span className="sr-only">Chatmate</span>
          </Link>

          {routes.map((link, index) =>
            link.navigate ? (
              <Link
                id={link.path}
                key={`${link.path}-${index}`}
                to={link.path}
                preventScrollReset={!link.navigate}
                className={cn(
                  isActive({
                    matches,
                    path: link.path,
                    chatbotId,
                  })
                    ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                    : "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                )}
              >
                {link.icon ? <link.icon className="h-5 w-5" /> : null}
                {link.title}
              </Link>
            ) : (
              <div
                id={link.path}
                key={`${link.path}-${index}`}
                onClick={() => (window.location = link.path)}
                className={cn(
                  isActive({
                    matches,
                    path: link.path,
                    chatbotId,
                  })
                    ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                    : "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                )}
              >
                {link.icon ? <link.icon className="h-5 w-5" /> : null}
                {link.title}
              </div>
            ),
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
