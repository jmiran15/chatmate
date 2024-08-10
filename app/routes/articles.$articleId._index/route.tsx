import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import ReactMarkdown from "react-markdown";
import { prisma } from "~/db.server";
import { DateTime } from "luxon";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { articleId } = params;
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      title: true,
      markdownContent: true,
      createdAt: true,
    },
  });

  if (!article) {
    throw new Response("Article not found", { status: 404 });
  }

  return json({ article });
};

export default function Article() {
  const { article } = useLoaderData<typeof loader>();

  if (!article) {
    return <div className="container mx-auto py-8">Article not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">{article.title}</h1>
      <div className="text-sm text-gray-500">
        {DateTime.fromISO(article.createdAt).toLocaleString(DateTime.DATE_FULL)}
      </div>
      <div className="max-w-none overflow-y-auto"></div>
    </div>
  );
}
