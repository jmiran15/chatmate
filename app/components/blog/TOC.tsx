import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-scroll";
import { Card, CardContent } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "lucide-react";
import { useMobileScreen } from "~/utils/mobile";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const generateId = (text: string, index: number) => {
    return `${text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")}-${index}`;
  };

  const updateTOC = useCallback(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(
      article.querySelectorAll("h2, h3, h4, h5, h6"),
    ) as HTMLHeadingElement[];

    const tocItems = headings.map((heading, index) => {
      const id = generateId(heading.textContent || "", index);
      heading.id = id;
      return {
        id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.charAt(1)),
      };
    });

    setToc(tocItems);
  }, []);

  useEffect(() => {
    updateTOC();

    const observer = new MutationObserver(updateTOC);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [updateTOC]);

  useEffect(() => {
    const observerOptions = {
      rootMargin: "-20% 0px -80% 0px",
    };

    const headingElements = toc.map(({ id }) => document.getElementById(id));
    const observers = headingElements.map((element) => {
      if (element) {
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }, observerOptions);

        observer.observe(element);
        return observer;
      }
      return null;
    });

    return () => {
      observers.forEach((observer) => observer && observer.disconnect());
    };
  }, [toc]);

  const handleSetActive = (id: string) => {
    setActiveId(id);
  };

  const tocRef = useRef<HTMLUListElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useMobileScreen();

  const handleScroll = useCallback(() => {
    if (tocRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = tocRef.current;
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
      setIsAtTop(scrollTop === 0);
    }
  }, []);

  useEffect(() => {
    const tocElement = tocRef.current;
    if (tocElement) {
      tocElement.addEventListener("scroll", handleScroll);
      return () => tocElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    if (tocRef.current && activeItemRef.current) {
      setTimeout(() => {
        const tocRect = tocRef.current!.getBoundingClientRect();
        const activeItemRect = activeItemRef.current!.getBoundingClientRect();

        const isInView =
          activeItemRect.top >= tocRect.top &&
          activeItemRect.bottom <= tocRect.bottom;

        if (!isInView) {
          const scrollTop = tocRef.current!.scrollTop;
          const offsetTop = activeItemRect.top - tocRect.top;
          const targetScroll =
            scrollTop +
            offsetTop -
            tocRect.height / 2 +
            activeItemRect.height / 2;

          tocRef.current.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }
      }, 0);
    }
  }, [activeId]);

  const toggleTOC = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (id: string) => {
    handleSetActive(id);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <motion.button
          className="fixed bottom-4 right-4 z-50 bg-orange-500 text-white p-3 rounded-full shadow-lg"
          onClick={toggleTOC}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isOpen ? <X size={24} /> : <List size={24} />}
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="fixed bottom-20 right-4 z-40 w-64 max-h-[70vh] overflow-hidden rounded-lg shadow-lg"
            >
              <div className="absolute inset-0 bg-gray-800 opacity-80 backdrop-blur-sm" />
              <Card className="relative bg-transparent">
                <CardContent className="p-4">
                  <nav className="space-y-4">
                    <h2 className="text-lg font-semibold mb-2 text-white">
                      Table of Contents
                    </h2>
                    <ul
                      ref={tocRef}
                      className="space-y-2 max-h-[calc(70vh-4rem)] overflow-y-auto pr-2 scrollbar-none"
                      onScroll={handleScroll}
                    >
                      {toc.map((item, index) => (
                        <li
                          key={`toc-${index}`}
                          ref={activeId === item.id ? activeItemRef : null}
                          style={{ marginLeft: `${(item.level - 2) * 12}px` }}
                        >
                          <Link
                            to={item.id}
                            spy={true}
                            smooth={true}
                            offset={-100}
                            duration={500}
                            onClick={() => handleItemClick(item.id)}
                            className={`block py-1 text-sm hover:text-orange-500 cursor-pointer truncate max-w-[200px] transition-colors duration-200 ${
                              activeId === item.id
                                ? "text-orange-500 font-medium"
                                : "text-gray-300"
                            }`}
                          >
                            {item.text}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <Card className="bg-gray-100 dark:bg-gray-800 sticky top-8 overflow-hidden">
      <CardContent className="p-4">
        <nav className="space-y-4">
          <h2 className="text-lg font-semibold mb-2">Table of Contents</h2>
          <div className="relative">
            <ul
              ref={tocRef}
              className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
              onScroll={handleScroll}
            >
              {toc.map((item, index) => (
                <li
                  key={`toc-${index}`}
                  ref={activeId === item.id ? activeItemRef : null}
                  style={{ marginLeft: `${(item.level - 2) * 12}px` }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block">
                          <Link
                            to={item.id}
                            spy={true}
                            smooth={true}
                            offset={-100}
                            duration={500}
                            onSetActive={handleSetActive}
                            className={`block py-1 text-sm hover:text-orange-500 cursor-pointer truncate max-w-[200px] transition-colors duration-200 ${
                              activeId === item.id
                                ? "text-orange-500 font-medium"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {item.text}
                          </Link>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              ))}
            </ul>
            {!isAtTop && (
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-100 to-transparent dark:from-gray-800 pointer-events-none" />
            )}
            {!isAtBottom && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-800 pointer-events-none" />
            )}
          </div>
        </nav>
      </CardContent>
    </Card>
  );
}
