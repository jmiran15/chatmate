import { Link, Outlet, useNavigate } from "@remix-run/react";
import { X } from "lucide-react";
import { Icons } from "~/components/icons";

export default function AuthLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}

const AuthHeader = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <header className="sticky top-0 h-16 border-b bg-muted/40">
      <div className="flex items-center justify-between mx-auto h-full px-4 max-w-6xl">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Icons.logo className="h-8 w-8" />
          <span className="text-lg">Chatmate</span>
        </Link>
        <button
          onClick={handleGoBack}
          className="p-2 rounded-full hover:bg-muted/60 transition-colors"
          aria-label="Go back"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};
