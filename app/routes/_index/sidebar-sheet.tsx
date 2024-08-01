import { Sheet, SheetContent } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Link, useLocation } from "@remix-run/react";
import { Menu } from "lucide-react";
import { Icons } from "../../components/icons";
import { useEffect, useState } from "react";
import { useLinks } from "./use-links";
import SidebarLink from "./sidebar-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

export default function SidebarSheet() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { routes } = useLinks();

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
            link.children ? (
              <Accordion
                key={`${link.path}-${index}`}
                type="single"
                collapsible
              >
                <AccordionItem value={link.title} className="border-b-0">
                  <AccordionTrigger className="flex items-center rounded-xl pl-3 py-2 hover:no-underline [&[data-state=open]>div]:text-foreground">
                    <div className="mx-[-0.65rem] flex items-center gap-4 text-muted-foreground">
                      {link.icon ? <link.icon className="h-5 w-5" /> : null}
                      {link.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-7 flex flex-col space-y-1">
                      {link.children.map((child, childIndex) => (
                        <SidebarLink
                          key={`${child.path}-${childIndex}`}
                          link={child}
                          isMobile
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <SidebarLink key={`${link.path}-${index}`} link={link} isMobile />
            ),
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
