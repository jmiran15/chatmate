"use client";

import { NavLink } from "@remix-run/react";

// import { siteConfig } from "@/config/site";
import { cn } from "~/lib/utils";
import { Icons } from "./icons";

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <NavLink to="/" className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">Chatmate</span>
      </NavLink>
      {/* <nav className="flex items-center gap-6 text-sm">
        <Link
          href="/docs"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/docs" ? "text-foreground" : "text-foreground/60",
          )}
        >
          Docs
        </Link>
        <Link
          href="/docs/components"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/docs/components")
              ? "text-foreground"
              : "text-foreground/60",
          )}
        >
          Components
        </Link>
        <Link
          href="/themes"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/themes")
              ? "text-foreground"
              : "text-foreground/60",
          )}
        >
          Themes
        </Link>
        <Link
          href="/examples"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname?.startsWith("/examples")
              ? "text-foreground"
              : "text-foreground/60",
          )}
        >
          Examples
        </Link>
        <Link
          href={siteConfig.links.github}
          className={cn(
            "hidden text-foreground/60 transition-colors hover:text-foreground/80 lg:block",
          )}
        >
          GitHub
        </Link>
      </nav> */}
    </div>
  );
}
