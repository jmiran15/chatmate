import { useSubmit } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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

export default function DeleteAccount() {
  const submit = useSubmit();

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your Chatmate account, all of your chatbots and
          their respective data.
        </CardDescription>
      </CardHeader>
      <CardFooter className="rounded-b-md border-t px-6 py-4 bg-destructive/10">
        {/* alert dialog to confirm */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  submit(
                    {
                      intent: "deleteAccount",
                    },
                    {
                      method: "post",
                    },
                  )
                }
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
