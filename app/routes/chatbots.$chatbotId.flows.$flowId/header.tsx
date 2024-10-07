import { Link, useNavigation } from "@remix-run/react";
import { ArrowLeft, Trash2 } from "lucide-react";
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

interface HeaderProps {
  flowName: string;
  handleDelete: () => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  canSave: boolean;
}

const Header = ({
  flowName,
  handleDelete,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  canSave,
}: HeaderProps) => {
  const isSubmitting = useNavigation().state === "submitting";
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link to="../flows">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{flowName}</h1>
      </div>
      <div className="flex items-center space-x-2">
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button
              type="button"
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
                flow and remove its data from our servers.
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
        <Button disabled={!canSave} type="submit">
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default Header;
