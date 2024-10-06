import { Link, useLocation, useParams } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icons } from "~/components/icons";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useOptionalUser } from "~/utils";
import { useMobileScreen } from "~/utils/mobile";
import { MarketingLink } from "./marketing-link";
import ProfileDropdown from "./profile-dropdown";
import SidebarSheet from "./sidebar-sheet";
import { useLinks } from "./use-links";

export function useScrollY(containerRef?: React.RefObject<HTMLElement>) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef?.current) {
        setScrollY(containerRef.current.scrollTop);
      } else {
        setScrollY(window.scrollY);
      }
    };

    const target = containerRef?.current || window;
    target.addEventListener("scroll", handleScroll);

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  return scrollY;
}

export default function MarketingLinks() {
  const { routes } = useLinks();
  const scrollY = useScrollY();

  return (
    <ul className="absolute left-4 right-4 z-[60] hidden items-center justify-center gap-x-5 md:flex">
      <motion.div
        initial={{ x: 0 }}
        animate={{
          boxShadow:
            scrollY >= 120
              ? "0 0 0 1px rgba(17,24,28,.08), 0 1px 2px -1px rgba(17,24,28,.08), 0 2px 4px rgba(17,24,28,.04)"
              : "none",
        }}
        transition={{
          ease: "linear",
          duration: 0.05,
          delay: 0.05,
        }}
        className="flex w-auto items-center justify-center overflow-hidden rounded-full px-6 py-2.5 transition-all bg-background md:p-2"
      >
        <nav className="relative h-full items-center justify-between gap-x-3.5 md:flex">
          <ul className="flex h-full flex-col justify-center gap-6 md:flex-row md:justify-start md:gap-2 lg:gap-4">
            {routes.map((route, index) => (
              <MarketingLink
                key={index}
                path={route.path}
                rounded={scrollY >= 120}
              >
                {route.title}
              </MarketingLink>
            ))}
          </ul>
        </nav>
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: scrollY >= 120 ? "auto" : 0,
          }}
          transition={{
            ease: "linear",
            duration: 0.25,
            delay: 0.05,
          }}
          className="!hidden overflow-hidden rounded-full md:!block md:ml-2 lg:ml-4"
        >
          <AnimatePresence>
            {scrollY >= 120 && (
              <motion.ul
                initial={{ x: "125%" }}
                animate={{ x: "0" }}
                exit={{
                  x: "125%",
                  transition: { ease: "linear", duration: 1 },
                }}
                transition={{ ease: "linear", duration: 0.3 }}
                className="shrink-0 whitespace-nowrap"
              >
                <Button asChild>
                  <Link
                    to="/join"
                    className="relative inline-flex w-fit items-center justify-center gap-x-1.5 overflow-hidden rounded-full outline-none "
                  >
                    Get Started
                  </Link>
                </Button>
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </ul>
  );
}

// TODO: Issue - when user, we get profile button but the background is transparent
export const Header = () => {
  const user = useOptionalUser();
  const { chatbotId } = useParams();
  const sheet = (user && chatbotId) || !user;
  const isMobile = useMobileScreen();
  const location = useLocation();

  const scrollY = useScrollY();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  return (
    <header
      className={cn(
        "sticky top-0 h-16 z-50",
        // user || isMobile ? "bg-muted/40 backdrop-blur-sm" : "",
        (!user && scrollY < 120) || user || isMobile ? "border-b" : "",
      )}
      style={{
        ...((user || isMobile) && {
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(244, 244, 245, 0.4)",
        }),
      }}
    >
      <div
        className={cn(
          "flex items-center justify-between mx-auto gap-4 h-full px-4 relative ",
          chatbotId ? "w-full" : "max-w-6xl",
        )}
      >
        <div className="flex items-center gap-8 ">
          {sheet ? <SidebarSheet /> : null}
          {scrollY < 120 || user ? (
            <Link
              to="/"
              className="hidden lg:flex items-center gap-2 font-semibold absolute left-4 z-[70]"
            >
              <Icons.logo className="h-6 w-6" />
              <span className="text-lg">Chatmate</span>
            </Link>
          ) : null}
          {!user ? <MarketingLinks /> : null}
        </div>

        {user ? (
          <ProfileDropdown />
        ) : (
          (scrollY < 120 || isMobile) && (
            <div className="flex items-center gap-2  z-[70]">
              <Link
                to="/login"
                className={buttonVariants({ variant: "outline" })}
              >
                Log In
              </Link>

              <Link to="/join" className={buttonVariants()}>
                Get Started
              </Link>
            </div>
          )
        )}
      </div>
    </header>
  );
};
