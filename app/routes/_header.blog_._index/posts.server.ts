export interface Frontmatter {
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  featured: boolean;
}

export interface PostMeta {
  slug: string;
  frontmatter: Frontmatter;
}

export const getPosts = async (): Promise<PostMeta[]> => {
  const modules = import.meta.glob<{ frontmatter: Frontmatter }>(
    "../_header.blog.*.mdx",
    { eager: true },
  );
  const build = await import("virtual:remix/server-build");
  const posts = Object.entries(modules).map(([file, post]) => {
    const id = file.replace("../", "").replace(/\.mdx$/, "");
    console.log("file - id: ", file, id, build.routes);
    const slug = build.routes[`routes/${id}`].path;
    if (slug === undefined) throw new Error(`No route for ${id}`);

    return {
      slug,
      frontmatter: post.frontmatter,
    };
  });
  return sortBy(posts, (post) => post.frontmatter.published, "desc");
};

function sortBy<T>(
  arr: T[],
  key: (item: T) => any,
  dir: "asc" | "desc" = "asc",
) {
  return arr.sort((a, b) => {
    const res = compare(key(a), key(b));
    return dir === "asc" ? res : -res;
  });
}

function compare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
