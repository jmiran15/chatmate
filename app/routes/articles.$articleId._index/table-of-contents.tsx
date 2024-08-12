import { useState, useEffect, useCallback } from "react";
import { Link } from "react-scroll";
import { Card, CardContent } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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

  return (
    <Card className="bg-gray-100 dark:bg-gray-800">
      <CardContent className="p-4">
        <nav className="space-y-2">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <ul className="space-y-2">
            {toc.map((item, index) => (
              <li
                key={`toc-${index}`}
                style={{ marginLeft: `${(item.level - 2) * 16}px` }}
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
                          className={`block py-1 text-sm hover:text-orange-500 cursor-pointer truncate max-w-[200px] ${
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
        </nav>
      </CardContent>
    </Card>
  );
}
