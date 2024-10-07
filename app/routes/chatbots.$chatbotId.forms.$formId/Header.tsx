import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import SubmissionsModal from "./SubmissionsModal";
import { loader } from "./route";

export default function Header() {
  const { chatbotId } = useParams();
  const { form } = useLoaderData<typeof loader>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const fetcher = useFetcher({ key: "deleteForm" });

  function handleDelete() {
    fetcher.submit({ intent: "deleteForm" }, { method: "post" });
    setIsDeleteDialogOpen(false);
  }

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm border-b">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/chatbots/${chatbotId}/forms`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{form.name}</h1>
      </div>
      <div className="flex items-center space-x-2">
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                form and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" onClick={() => setIsSubmissionsOpen(true)}>
          View submissions
        </Button>
        <SubmissionsModal
          isOpen={isSubmissionsOpen}
          onClose={() => setIsSubmissionsOpen(false)}
          submissions={form.submissions}
        />
      </div>
    </div>
  );
}
