import { useParams } from "@remix-run/react";
import { useLinks } from "../_index/use-links";
import SidebarLink from "../_index/sidebar-link";

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
          {routes.map((link, index) => (
            <SidebarLink key={`${link.path}-${index}`} link={link} />
          ))}
        </nav>
      </div>
    </div>
  );
}
