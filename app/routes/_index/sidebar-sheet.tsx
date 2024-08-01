import { Sheet, SheetContent } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";
import { Link, useLocation } from "@remix-run/react";
import { Menu } from "lucide-react";
import { Icons } from "../../components/icons";
import { useEffect, useState } from "react";
import { RouteLink, useLinks } from "./use-links";
import SidebarLink from "./sidebar-link";

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

          {routes.map((link, index) => (
            <SidebarLink key={`${link.path}-${index}`} link={link} isMobile />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
