import { json, type MetaFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { generateMetaTags, generateCanonicalUrl } from "~/utils/seo";

import { getPosts, searchPosts, invalidateCache } from "./posts.server";
import { Post } from "./post";

export const meta: MetaFunction = ({ location }) => {
  const canonicalUrl = generateCanonicalUrl(location.pathname);

  return [
    ...generateMetaTags({
      title: "Chatmate Blog - AI Customer Support Insights",
      description:
        "Explore the latest insights on AI-powered customer support, chatbots, and improving customer experience with Chatmate's innovative solutions.",
      url: canonicalUrl,
    }),
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  try {
    const posts = query ? await searchPosts(query) : await getPosts();
    console.log(`Loader: Query "${query}" returned ${posts.length} results`);
    return json({ posts, query, error: null });
  } catch (error) {
    console.error("Search error:", error);
    return json({
      posts: [],
      query,
      error: "An error occurred while searching. Please try again.",
    });
  }
};

export default function Component() {
  const { posts, query, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(query || "");

  const debouncedSearch = useDebouncedCallback((term: string) => {
    setSearchParams(term ? { q: term } : {});
  }, 300);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Chatmate Blog</h1>
      <p className="text-xl text-center mb-8">
        Explore the latest insights on AI-powered customer support
      </p>

      <Form className="mb-12">
        <input
          type="text"
          name="q"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search blog posts..."
          className="w-full max-w-md mx-auto block px-4 py-2 border border-gray-300 rounded-md"
        />
      </Form>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {searchTerm && (
        <p className="text-center mb-4">Showing results for: "{searchTerm}"</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {posts.map((post) => (
          <Post key={post.slug} {...post} />
        ))}
      </div>

      {posts.length === 0 && <p className="text-center">No posts found.</p>}
    </div>
  );
}
