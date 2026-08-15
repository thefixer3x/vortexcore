import { ChevronRight } from "lucide-react";
import React from "react";

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}

export const SettingItem = ({ icon, label, description, onClick }: SettingItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4">
        {icon}
        <div className="flex-1">
          <span className="font-medium">{label}</span>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};