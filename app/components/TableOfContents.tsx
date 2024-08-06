import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([]);

  const generateId = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const updateTOC = useCallback(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(
      article.querySelectorAll("h2, h3, h4, h5, h6"),
    ) as HTMLHeadingElement[];

    const tocItems = headings.map((heading) => {
      const id = heading.id || generateId(heading.textContent || "");
      if (!heading.id) {
        heading.id = id;
      }
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

  return (
    <Card className="mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <CardHeader>
        <CardTitle>
          <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
            Jump ahead
          </span>
          <h2 className="text-xl font-semibold mt-1">In this article</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-2">
            {toc.map((item, index) => (
              <li
                key={`toc-${index}`}
                style={{ marginLeft: `${(item.level - 2) * 16}px` }}
              >
                <Link
                  to={item.id}
                  spy={true}
                  smooth={true}
                  offset={-100}
                  duration={500}
                  className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 cursor-pointer underline"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  );
}
