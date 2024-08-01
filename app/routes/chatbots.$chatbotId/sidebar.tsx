import { useParams } from "@remix-run/react";
import { useLinks } from "../_index/use-links";
import SidebarLink from "../_index/sidebar-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

export default function Sidebar() {
  const { chatbotId } = useParams();
  const { routes } = useLinks();

  if (!chatbotId) {
    return null;
  }

  return (
    // large and medium screens
    <div className="hidden border-r bg-muted/40 lg:block">
      <div className="flex flex-col h-full max-h-screen gap-2">
        <nav className="grid items-start p-2 text-sm font-medium lg:p-4 ">
          {routes.map((link, index) =>
            link.children ? (
              <Accordion
                key={`${link.path}-${index}`}
                type="single"
                collapsible
              >
                <AccordionItem value={link.title} className="border-b-0">
                  <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:no-underline">
                    <div className="flex items-center gap-3">
                      {link.icon ? <link.icon className="h-4 w-4" /> : null}
                      {link.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-7 flex flex-col space-y-1">
                      {link.children.map((child, childIndex) => (
                        <SidebarLink
                          key={`${child.path}-${childIndex}`}
                          link={child}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <SidebarLink key={`${link.path}-${index}`} link={link} />
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
