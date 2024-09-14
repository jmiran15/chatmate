import { Link } from "@remix-run/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import React from "react";
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
  onSave: () => void;
  onDelete: () => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  confirmDelete: () => void;
}

const Header: React.FC<HeaderProps> = ({
  flowName,
  onSave,
  onDelete,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  confirmDelete,
}) => {
  return (
    <div className="flex justify-between items-center p-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
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
            <Button variant="ghost" size="icon" onClick={onDelete}>
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
              <AlertDialogAction onClick={confirmDelete}>
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
};

export default Header;
