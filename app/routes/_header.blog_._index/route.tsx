import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getPosts } from "./posts.server";
import { Post } from "./post";

export const loader = async () => json(await getPosts());

export default function Component() {
  const posts = useLoaderData<typeof loader>();
  console.log("POSTS: ", posts);

  return (
    <div className="p-10 h-screen">
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Post {...post} />
          </li>
        ))}
      </ul>
    </div>
  );
}
