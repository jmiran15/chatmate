import { useParams } from "@remix-run/react";
import { useEventSource } from "remix-utils/sse/react";
import { useEffect, useState } from "react";
import { JobProgress } from "../api.articles.$articleId.progress";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";

export default function ArticleProgress() {
  const { articleId } = useParams();
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const eventSource = useEventSource(`/api/articles/${articleId}/progress`);

  useEffect(() => {
    if (eventSource) {
      try {
        const progress = JSON.parse(eventSource) as JobProgress;
        setJobProgress(progress);
        setError(null);
        // Initialize all jobs as expanded
        setExpandedJobs(new Set(getAllJobIds(progress)));
      } catch (err) {
        setError("Failed to parse job progress data");
      }
    }
  }, [eventSource]);

  // Helper function to get all job IDs
  const getAllJobIds = (job: JobProgress): string[] => {
    let ids = [job.jobId];
    if (job.children) {
      job.children.forEach((child) => {
        ids = [...ids, ...getAllJobIds(child)];
      });
    }
    return ids;
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const renderJobCard = (job: JobProgress, depth: number = 0) => {
    const statusIcon = () => {
      switch (job.status) {
        case "pending":
        case "active":
          return <Loader2 className="animate-spin" />;
        case "completed":
          return <CheckCircle className="text-green-500" />;
        case "failed":
          return <XCircle className="text-red-500" />;
        default:
          return <AlertCircle className="text-yellow-500" />;
      }
    };

    const isExpanded = expandedJobs.has(job.jobId);

    const jobBackgroundColor = () => {
      switch (job.status) {
        case "completed":
          return "bg-green-50";
        case "failed":
          return "bg-red-50";
        case "active":
          return "bg-blue-50";
        default:
          return "bg-gray-50";
      }
    };

    return (
      <Card
        key={job.jobId}
        className={`mb-2 ${jobBackgroundColor()} ${
          job.status === "failed" ? "opacity-80" : ""
        }`}
      >
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {statusIcon()}
                <span title={`Job ID: ${job.jobId}`}>{job.jobId}</span>
              </div>
              {job.children && job.children.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleJobExpansion(job.jobId)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          {job.status === "failed" && (
            <div className="text-red-500 text-sm mb-2">Error</div>
          )}
          {isExpanded &&
            job.children &&
            job.children.map((child) => renderJobCard(child, depth + 1))}
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!jobProgress) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Article Generation Progress</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-start space-x-2">
          <Button
            onClick={() => setExpandedJobs(new Set(getAllJobIds(jobProgress!)))}
          >
            Expand All
          </Button>
          <Button onClick={() => setExpandedJobs(new Set())}>
            Collapse All
          </Button>
        </div>
      </div>
      {renderJobCard(jobProgress)}
    </div>
  );
}
