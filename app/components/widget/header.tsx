import { Form, useParams } from "@remix-run/react";
import { RefreshCcw, X } from "lucide-react";
import { CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export default function WidgetHeader({ close }: { close: () => void }) {
  const { chatbotId } = useParams();
  return (
    // <div className="flex items-center justify-between bg-indigo-500 p-5 rounded-t-2xl">
    // {/* <div className="flex items-center">
    //   <img
    //     src="https://s3-alpha.figma.com/hub/file/1913095808/a7bdc469-cd70-4ea1-bb57-b59204ad8182-cover.png"
    //     alt="Chatmate"
    //     className="h-6 w-6 rounded-full mr-2"
    //   />
    //   <span className="text-white font-medium">Chatmate</span>
    // </div>
    // <div className="flex items-center">
    //   <Form method="post" action="/clear">
    //     <input type="hidden" name="chatbotId" value={chatbotId} />
    //     <button
    //       type="submit"
    //       className="text-white hover:text-opacity-80 transition ease-in-out duration-150"
    //     >
    //       <RefreshCcw className="h-5 w-5" />
    //     </button>
    //   </Form>
    //   <button
    //     className="text-white hover:text-opacity-80 transition ease-in-out duration-150 ml-2"
    //     onClick={close}
    //   >
    //     <X className="h-5 w-5" />
    //   </button>
    // </div> */}

    <CardHeader className="flex flex-row items-center">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src="/avatars/01.png" alt="Image" />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">Sofia Davis</p>
          <p className="text-sm text-muted-foreground">m@example.com</p>
        </div>
      </div>

      <Form method="post" action="/clear" className="ml-auto">
        <input type="hidden" name="chatbotId" value={chatbotId} />
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          type="submit"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </Form>
      {/* <button className="text-white hover:text-opacity-80 transition ease-in-out duration-150 ml-2">
        <X className="h-5 w-5" />
      </button> */}
      {/* <Button onClick={close}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button> */}
    </CardHeader>
    // </div>
  );
}
