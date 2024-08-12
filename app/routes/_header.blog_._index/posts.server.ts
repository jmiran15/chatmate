import { LRUCache } from "lru-cache";
import lunr from "lunr";

export interface Frontmatter {
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  featured: boolean;
  image: string; // New field for image URL
  content?: string; // Add content field
}

export interface PostMeta {
  slug: string;
  frontmatter: Frontmatter;
}

const cache = new LRUCache<string, any>({
  max: 500, // Maximum number of items to store in the cache
  ttl: 1000 * 60 * 60, // Cache TTL: 1 hour
});

export const getPosts = async (): Promise<PostMeta[]> => {
  const cachedPosts = cache.get("posts");
  if (cachedPosts) {
    console.log("Cache hit: Returning cached posts");
    return cachedPosts;
  }

  console.log("Cache miss: Fetching posts from source");
  const modules = import.meta.glob<{
    frontmatter: Frontmatter;
    default: { compiledSource: string };
  }>("../_header.blog.*.mdx", { eager: true });
  const build = await import("virtual:remix/server-build");

  const posts = Object.entries(modules).map(([file, post]) => {
    const id = file.replace("../", "").replace(/\.mdx$/, "");
    const slug = build.routes[`routes/${id}`].path;
    if (slug === undefined) throw new Error(`No route for ${id}`);

    return {
      slug,
      frontmatter: {
        ...post.frontmatter,
        content: post.default.compiledSource, // Include compiled MDX content
      },
    };
  });

  const sortedPosts = sortBy(
    posts,
    (post) => post.frontmatter.published,
    "desc",
  );

  cache.set("posts", sortedPosts);

  return sortedPosts;
};

export const searchPosts = async (query: string): Promise<PostMeta[]> => {
  const posts = await getPosts();
  const cachedIndex = cache.get("searchIndex");
  let searchIndex: lunr.Index;

  if (cachedIndex) {
    console.log("Cache hit: Using cached search index");
    searchIndex = lunr.Index.load(cachedIndex);
  } else {
    console.log("Cache miss: Building new search index");
    searchIndex = lunr(function () {
      this.field("title", { boost: 10 });
      this.field("description", { boost: 5 });
      this.field("content");
      this.ref("slug");

      posts.forEach((post) => {
        console.log(`Indexing: ${post.slug}`);
        console.log(`Title: ${post.frontmatter.title}`);
        console.log(
          `Description: ${post.frontmatter.description.substring(0, 50)}...`,
        );

        this.add({
          slug: post.slug,
          title: post.frontmatter.title,
          description: post.frontmatter.description,
          content: post.frontmatter.content,
        });
      });
    });

    cache.set("searchIndex", searchIndex.toJSON());
  }

  console.log(`Searching for: "${query}"`);

  const searchTerms = query.toLowerCase().split(/\s+/);
  const results = searchIndex.query(function (q) {
    searchTerms.forEach((term) => {
      q.term(term, {
        boost: 10,
        usePipeline: true,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      q.term(term, { boost: 1, usePipeline: false, editDistance: 1 });
    });
  });

  console.log(`Search results:`, results);

  return results
    .map((result) => {
      const post = posts.find((post) => post.slug === result.ref);
      if (!post) {
        console.warn(`Post not found for slug: ${result.ref}`);
      }
      return post!;
    })
    .filter(Boolean);
};

export const invalidateCache = () => {
  cache.delete("posts");
  cache.delete("searchIndex");
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
