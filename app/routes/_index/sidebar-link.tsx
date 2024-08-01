import { Link, useMatches, useParams } from "@remix-run/react";
import { Fragment } from "react/jsx-runtime";
import { RouteLink } from "./use-links";
import { cn, isActive } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";

export default function SidebarLink({
  link,
  isMobile = false,
}: {
  link: RouteLink;
  isMobile?: boolean;
}) {
  const { chatbotId } = useParams();
  const matches = useMatches();

  return (
    <Fragment>
      {link.navigate ? (
        <Link
          id={link.path}
          to={link.path}
          preventScrollReset={!link.navigate}
          className={cn(
            !isMobile &&
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            isActive({
              matches,
              path: link.path,
              chatbotId,
            })
              ? isMobile
                ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                : "bg-muted text-primary"
              : isMobile
              ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              : "text-muted-foreground",
          )}
        >
          {link.icon ? (
            <link.icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          ) : null}
          {link.title}
          {link.badge ? (
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              {link.badge}
            </Badge>
          ) : null}
        </Link>
      ) : (
        <div
          id={link.path}
          onClick={() => (window.location.href = link.path)}
          className={cn(
            !isMobile &&
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            isActive({
              matches,
              path: link.path,
              chatbotId,
            })
              ? isMobile
                ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                : "bg-muted text-primary"
              : isMobile
              ? "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              : "text-muted-foreground",
          )}
        >
          {link.icon ? (
            <link.icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          ) : null}
          {link.title}
        </div>
      )}
    </Fragment>
  );
}
