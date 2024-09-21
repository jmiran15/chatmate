import { FormSubmission } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { DateTime } from "luxon";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export default function SubmissionsModal({
  isOpen,
  onClose,
  submissions,
}: {
  isOpen: boolean;
  onClose: () => void;
  submissions: SerializeFrom<FormSubmission[]>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Submissions</DialogTitle>
        </DialogHeader>
        <div className="h-full pr-4">
          {submissions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No submissions yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {submissions.map((submission: SerializeFrom<FormSubmission>) => {
                if (!submission.submissionData) return null;
                return (
                  <Card key={submission.id} className="p-4">
                    {Object.entries(submission.submissionData).map(
                      ([key, value]) => (
                        <div key={key} className="mb-2">
                          <span className="font-bold">{key}:</span>{" "}
                          <span>{value}</span>
                        </div>
                      ),
                    )}
                    <div className="text-sm text-gray-500 mt-4">
                      Submitted on:{" "}
                      {DateTime.fromISO(submission.createdAt).toLocaleString(
                        DateTime.DATETIME_FULL,
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
