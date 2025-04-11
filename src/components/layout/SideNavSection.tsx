
import { LucideIcon } from "lucide-react";
import { SideNavItem } from "./SideNavItem";

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface SideNavSectionProps {
  title?: string;
  items: NavItem[];
  currentPath: string;
}

export function SideNavSection({ title, items, currentPath }: SideNavSectionProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <div className="px-3 py-2 mt-4">
      {title && (
        <h4 className="text-xs text-muted-foreground font-medium px-4 mb-2">
          {title.toUpperCase()}
        </h4>
      )}
      
      {items.map((item) => (
        <SideNavItem
          key={item.path}
          icon={item.icon}
          name={item.name}
          path={item.path}
          isActive={isActive(item.path)}
        />
      ))}
    </div>
  );
}
