import { useParams } from "@remix-run/react";
import { useEventSource } from "remix-utils/sse/react";
import { useEffect, useState } from "react";
import { JobProgress } from "../api.articles.$articleId.progress";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function ArticleProgress() {
  const { articleId } = useParams();
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);

  const eventSource = useEventSource(`/api/articles/${articleId}/progress`);

  useEffect(() => {
    if (eventSource) {
      const progress = JSON.parse(eventSource) as JobProgress;
      setJobProgress(progress);
    }
  }, [eventSource]);

  const cancelJob = async (jobId: string) => {
    // Implement job cancellation logic here
    console.log(`Cancelling job: ${jobId}`);
    // You'll need to create a new API endpoint for cancelling jobs
    // and call it here
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

    return (
      <div
        key={job.jobId}
        className={`p-4 border rounded-md mb-2 ${
          job.status === "failed" ? "opacity-50" : ""
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {statusIcon()}
            <span>{job.jobId}</span>
          </div>
          <Button
            onClick={() => cancelJob(job.jobId)}
            disabled={job.status === "completed" || job.status === "failed"}
          >
            Cancel
          </Button>
        </div>
        {job.children &&
          job.children.map((child) => renderJobCard(child, depth + 1))}
      </div>
    );
  };

  if (!jobProgress) {
    return <div>Loading...</div>;
  }

  console.log("her");

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Article Generation Progress</h1>
      {renderJobCard(jobProgress)}
    </div>
  );
}
