import { Bot, CircleUser, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useFetcher, useNavigate } from "@remix-run/react";

export default function ProfileDropdown() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <CircleUser className="h-5 w-5" />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/chatbots")}>
          <Bot className="mr-2 h-4 w-4" />
          <span>View your chatbots</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/chatbots/settings/general")}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            fetcher.submit({}, { method: "post", action: "/logout" })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
