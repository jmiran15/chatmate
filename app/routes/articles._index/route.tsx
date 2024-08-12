import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { DateTime } from "luxon";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { prisma } from "~/db.server";
import { requireUserId } from "~/session.server";

// Define the type for our article data
type ArticleData = {
  id: string;
  title: string;
  createdAt: string;
  wordCount: number | null;
  readingTimeMs: number | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const articles = await prisma.article.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      wordCount: true,
      readingTimeMs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ articles });
};

const ArticleCard = ({ article }: { article: ArticleData }) => {
  const createdAt = DateTime.fromISO(article.createdAt);
  const readingTime = article.readingTimeMs
    ? DateTime.fromMillis(article.readingTimeMs)
    : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          Created on {createdAt.toLocaleString(DateTime.DATE_MED)}
        </p>
        <p className="text-sm text-gray-500">
          {article.wordCount ?? "Unknown"} words •{" "}
          {readingTime
            ? `${readingTime.toFormat("m")} min read`
            : "Unknown reading time"}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="w-full">
          <Link to={`/articles/${article.id}`}>View Article</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const ArticlesList = ({ articles }: { articles: ArticleData[] }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default function ArticlesIndex() {
  const { articles } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Articles</h1>
        <Button asChild>
          <Link to="/articles/new">New Article</Link>
        </Button>
      </div>
      <ArticlesList articles={articles} />
    </div>
  );
}

export const handle: SEOHandle = {
  getSitemapEntries: () => null,
};
