
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

export function NavBarLinks() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden md:flex items-center gap-1">
      <Link to="/dashboard">
        <Button
          variant={isActive("/dashboard") ? "default" : "ghost"}
          size="sm"
          className={`rounded-full px-4 ${isActive("/dashboard") ? "" : "hover:bg-muted"}`}
        >
          Control Room
        </Button>
      </Link>
      <Link to="/transactions">
        <Button
          variant={isActive("/transactions") ? "default" : "ghost"}
          size="sm"
          className={`rounded-full px-4 ${isActive("/transactions") ? "" : "hover:bg-muted"}`}
        >
          Transactions
        </Button>
      </Link>
      <Link to="/insights">
        <Button
          variant={isActive("/insights") ? "default" : "ghost"}
          size="sm"
          className={`rounded-full px-4 ${isActive("/insights") ? "" : "hover:bg-muted"}`}
        >
          VortexAI
        </Button>
      </Link>
      <Link to="/settings">
        <Button
          variant={isActive("/settings") ? "default" : "ghost"}
          size="sm"
          className={`rounded-full px-4 ${isActive("/settings") ? "" : "hover:bg-muted"}`}
        >
          Settings
        </Button>
      </Link>
      <Link to="/users">
        <Button
          variant={isActive("/users") ? "default" : "ghost"}
          size="sm"
          className={`rounded-full px-4 ${isActive("/users") ? "" : "hover:bg-muted"}`}
        >
          Users
        </Button>
      </Link>
    </div>
  );
}
