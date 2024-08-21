import { Link, useLocation } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { Icons } from "../../components/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Sheet, SheetContent } from "../../components/ui/sheet";
import SidebarLink from "./sidebar-link";
import { useLinks } from "./use-links";

export default function SidebarSheet() {
  const [open, setOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(
    undefined,
  );
  const location = useLocation();
  const { routes } = useLinks();

  const findAccordionToOpen = useCallback(
    (path: string) => {
      return routes.find(
        (route) =>
          route.children &&
          route.children.some((child) => path.startsWith(child.path)),
      );
    },
    [routes],
  );

  const updateAccordionState = useCallback(
    (path: string) => {
      const accordionToOpen = findAccordionToOpen(path);
      setOpenAccordion((prevState) => {
        const newState = accordionToOpen ? accordionToOpen.title : undefined;
        return prevState === newState ? prevState : newState;
      });
    },
    [findAccordionToOpen],
  );

  useEffect(() => {
    setOpen(false);
    updateAccordionState(location.pathname);
  }, [location.hash, location.pathname, updateAccordionState]);

  const handleAccordionChange = useCallback((value: string | undefined) => {
    setOpenAccordion(value);
  }, []);

  const memoizedAccordion = useMemo(
    () => (
      <nav className="grid gap-1 text-base font-medium">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold mb-4"
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
              value={openAccordion === link.title ? link.title : ""}
              onValueChange={handleAccordionChange}
            >
              <AccordionItem value={link.title} className="border-b-0">
                <AccordionTrigger
                  className={cn(
                    "flex items-center rounded-lg py-2 px-3 transition-all hover:no-underline text-base [&[data-state=open]>div]:text-foreground",
                    openAccordion === link.title
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                  aria-expanded={openAccordion === link.title}
                  id={`sidebar-item-${index}`}
                >
                  <motion.div
                    className="flex items-center gap-3 w-full"
                    whileHover={{ x: 1 }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                  >
                    {link.icon ? <link.icon className="h-5 w-5" /> : null}
                    {link.title}
                  </motion.div>
                </AccordionTrigger>
                <AnimatePresence initial={false}>
                  {openAccordion === link.title && (
                    <AccordionContent
                      forceMount
                      className="AccordionContent pl-10"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.04, 0.62, 0.23, 0.98],
                      }}
                    >
                      <div className="flex flex-col space-y-1">
                        {link.children.map((child, childIndex) => (
                          <SidebarLink
                            key={`${child.path}-${childIndex}`}
                            link={child}
                            isMobile
                            onClick={() => updateAccordionState(child.path)}
                            id={`sidebar-item-${index}-${childIndex}`}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  )}
                </AnimatePresence>
              </AccordionItem>
            </Accordion>
          ) : (
            <SidebarLink
              key={`${link.path}-${index}`}
              link={link}
              isMobile
              onClick={() => updateAccordionState(link.path)}
              id={`sidebar-item-${index}`}
            />
          ),
        )}
      </nav>
    ),
    [routes, openAccordion, handleAccordionChange, updateAccordionState],
  );

  if (typeof document === "undefined") {
    return null;
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
      <SheetContent side="left" className="w-[280px] p-0">
        <ScrollArea className="h-full px-4">{memoizedAccordion}</ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
