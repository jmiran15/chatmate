import { Link } from "@remix-run/react";

import type { PostMeta } from "./posts.server";

export const Post = ({ slug, frontmatter }: PostMeta) => {
  return (
    <Link to={`/blog/${slug}`} className="block group">
      <article className="space-y-4">
        {frontmatter.image ? (
          <img
            src={frontmatter.image}
            alt={frontmatter.title}
            className="w-full aspect-[3/2] object-cover rounded-lg drop-shadow-md"
          />
        ) : (
          <div className="w-full aspect-[3/2] bg-gray-200 flex items-center justify-center rounded-lg">
            <span className="text-gray-500">No image available</span>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">
            {frontmatter.title}
          </h3>
          <p className="text-muted-foreground text-sm">
            {frontmatter.description}
          </p>
          <time
            className="block text-sm text-muted-foreground"
            dateTime={frontmatter.published}
          >
            {new Date(frontmatter.published).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </article>
    </Link>
  );
};
