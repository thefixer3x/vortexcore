
import { ChevronRight } from "lucide-react";
import React from "react";

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const SettingItem = ({ icon, label, onClick }: SettingItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};
