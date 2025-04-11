
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SideNavItemProps {
  icon: LucideIcon;
  name: string;
  path: string;
  isActive: boolean;
}

export function SideNavItem({ icon: Icon, name, path, isActive }: SideNavItemProps) {
  return (
    <Link to={path} key={path}>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="lg"
        className={`w-full justify-start mb-1 ${
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted"
        }`}
      >
        <Icon className="mr-2 h-5 w-5" />
        {name}
      </Button>
    </Link>
  );
}
