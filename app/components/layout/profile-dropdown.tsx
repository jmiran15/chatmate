import { Bot, CircleUser, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useFetcher, useNavigate } from "@remix-run/react";
import { useOptionalUser } from "~/utils";
import { useRef } from "react";
import { useHoverEffect } from "~/hooks/use-hover-effect";
import { useMobileScreen } from "~/utils/mobile";

export default function ProfileDropdown() {
  const user = useOptionalUser();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const elementRef = useRef(null);
  const Effect = useHoverEffect(elementRef);
  const isMobile = useMobileScreen();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={elementRef}
          className="group relative translate-0 rounded-full lg:rounded-lg px-3 py-2"
        >
          {!isMobile ? <Effect /> : null}
          <div className="flex items-center gap-2">
            <CircleUser className="h-5 w-5" />
            <span className="hidden sm:inline-block">{user.email}</span>
            <span className="sr-only">Toggle user menu</span>
          </div>
        </button>
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
