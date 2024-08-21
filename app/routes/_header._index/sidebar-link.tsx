import { Link, useMatches, useParams } from "@remix-run/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { Badge } from "~/components/ui/badge";
import { cn, formatBadgeNumber, isActive } from "~/lib/utils";
import { RouteLink } from "./use-links";

const SidebarLink = memo(function SidebarLink({
  link,
  isMobile = false,
  onClick,
  id,
}: {
  link: RouteLink;
  isMobile?: boolean;
  onClick?: () => void;
  id: string;
}) {
  const { chatbotId } = useParams();
  const matches = useMatches();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    if (!link.navigate) {
      e.preventDefault();
      window.location.href = link.path;
    }
  };

  const isActiveLink = isActive({
    matches,
    path: link.path,
    chatbotId,
  });

  const linkContent = (
    <>
      {link.icon ? (
        <link.icon
          className={cn(
            isMobile ? "h-5 w-5" : "h-4 w-4",
            isActiveLink ? "text-primary" : "text-muted-foreground",
          )}
        />
      ) : null}
      <span className={cn(isActiveLink && "font-semibold")}>{link.title}</span>
      {link.badge ? (
        <Badge
          variant="outline"
          className={cn(
            "ml-auto flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1",
            isActiveLink
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-muted",
          )}
        >
          {formatBadgeNumber(link.badge)}
        </Badge>
      ) : null}
    </>
  );

  const linkClass = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isActiveLink
      ? "bg-accent text-primary relative after:absolute after:inset-0 after:rounded-lg after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-1px_0_0_rgba(0,0,0,0.1)] after:opacity-100"
      : "text-muted-foreground hover:bg-muted/60 relative after:absolute after:inset-0 after:rounded-lg after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-1px_0_0_rgba(0,0,0,0.1)] after:opacity-0 hover:after:opacity-100",
    isMobile && "text-base py-3",
  );

  return (
    <motion.div
      whileHover={{ x: 1 }}
      transition={{ duration: 0.1, ease: "easeInOut" }}
    >
      {link.navigate ? (
        <Link
          id={id}
          to={link.path}
          preventScrollReset={!link.navigate}
          onClick={handleClick}
          className={linkClass}
          role="menuitem"
          aria-current={isActiveLink ? "page" : undefined}
        >
          {linkContent}
        </Link>
      ) : (
        <div
          id={id}
          onClick={handleClick}
          className={linkClass}
          role="menuitem"
          tabIndex={0}
          aria-current={isActiveLink ? "page" : undefined}
        >
          {linkContent}
        </div>
      )}
    </motion.div>
  );
});

export default SidebarLink;
