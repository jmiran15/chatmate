import React, { useRef, useEffect } from "react";
import { Link } from "@remix-run/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { TableOfContents } from "./TableOfContents";
import type { PostMeta } from "~/routes/_header.blog_._index/posts.server";

interface BlogPostProps {
  post: PostMeta;
  children: React.ReactNode;
}

export function BlogPost({ post, children }: BlogPostProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      window.dispatchEvent(new CustomEvent("contentUpdated"));
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article className="space-y-8">
      <CardHeader>
        <CardTitle className="text-4xl font-bold">{post.title}</CardTitle>
        <time
          className="text-sm text-muted-foreground"
          dateTime={post.published}
        >
          {new Date(post.published).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-video mb-8">
          <img
            src={post.image}
            alt={post.title}
            className="object-cover w-full h-full rounded-lg shadow-md"
          />
        </div>
        <p className="text-lg text-muted-foreground mb-8">{post.description}</p>
        <TableOfContents />
        <div ref={contentRef} className="prose max-w-none">
          {children}
        </div>
      </CardContent>
      <Card className="bg-orange-100 dark:bg-orange-900 rounded-lg  shadow-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="mb-4">
            Sign up now and experience the power of our service!
          </p>
          <Button asChild>
            <Link to="/join">Sign Up Now</Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
}
