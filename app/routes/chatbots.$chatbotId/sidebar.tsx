import { useLocation, useParams } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { useSidebarWidth } from "~/providers/sidebarWidth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import SidebarLink from "../_header._index/sidebar-link";
import { useLinks } from "../_header._index/use-links";

export default function Sidebar() {
  const { chatbotId } = useParams();
  const { routes } = useLinks();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { setSidebarWidth } = useSidebarWidth();
  const [openAccordion, setOpenAccordion] = useState<string | undefined>(
    undefined,
  );

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

  // Initial check on mount and path change
  useEffect(() => {
    updateAccordionState(location.pathname);
  }, [location.pathname, updateAccordionState]);

  useEffect(() => {
    const updateWidth = () => {
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, [setSidebarWidth]);

  const handleAccordionChange = useCallback((value: string | undefined) => {
    setOpenAccordion(value);
  }, []);

  if (!chatbotId) {
    return null;
  }

  console.log(routes);

  const memoizedAccordion = useMemo(
    () => (
      <ul
        className="grid items-start p-2 text-sm font-medium lg:p-4"
        role="menu"
      >
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
                    "flex items-center rounded-lg pl-3 py-2 transition-all hover:no-underline hover:text-primary text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    openAccordion === link.title && "text-primary",
                  )}
                  aria-expanded={openAccordion === link.title}
                  id={`sidebar-item-${index}`}
                >
                  <motion.div
                    className="flex items-center gap-3"
                    whileHover={{ x: 1 }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                  >
                    {link.icon ? <link.icon className="h-4 w-4" /> : null}
                    {link.title}
                  </motion.div>
                </AccordionTrigger>
                <AnimatePresence initial={false}>
                  {openAccordion === link.title && (
                    <AccordionContent
                      forceMount
                      className="AccordionContent"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.04, 0.62, 0.23, 0.98],
                      }}
                    >
                      <ul className="ml-7 flex flex-col space-y-1" role="menu">
                        {link.children.map((child, childIndex) => (
                          <li key={`${child.path}-${childIndex}`} role="none">
                            <SidebarLink
                              link={child}
                              onClick={() => updateAccordionState(child.path)}
                              id={`sidebar-item-${index}-${childIndex}`}
                            />
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  )}
                </AnimatePresence>{" "}
              </AccordionItem>
            </Accordion>
          ) : (
            <li key={`${link.path}-${index}`} role="none">
              <SidebarLink
                link={link}
                onClick={() => updateAccordionState(link.path)}
                id={`sidebar-item-${index}`}
              />
            </li>
          ),
        )}
      </ul>
    ),
    [routes, openAccordion, handleAccordionChange, updateAccordionState],
  );

  return (
    <nav
      ref={sidebarRef}
      className="hidden border-r bg-muted/40 lg:block"
      aria-label="Main Navigation"
    >
      <div className="flex flex-col h-full max-h-screen">
        {memoizedAccordion}
      </div>
    </nav>
  );
}
