import { Link } from "@remix-run/react";
import { DateTime } from "luxon";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

// Hardcoded articles for now
const articles = [
  {
    id: "1",
    title: "10 Tips for Effective Time Management",
    createdAt: "2023-03-15T10:30:00Z",
    wordCount: 1500,
    readingTimeMs: 450000,
  },
  {
    id: "2",
    title: "The Future of Artificial Intelligence",
    createdAt: "2023-03-20T14:45:00Z",
    wordCount: 2000,
    readingTimeMs: 600000,
  },
  // Add more hardcoded articles as needed
];

const ArticleCard = ({ article }) => {
  const createdAt = DateTime.fromISO(article.createdAt);
  const readingTime = DateTime.fromMillis(article.readingTimeMs);

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
          {article.wordCount} words • {readingTime.toFormat("m")} min read
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

const ArticlesList = ({ articles }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default function ArticlesNew() {
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
