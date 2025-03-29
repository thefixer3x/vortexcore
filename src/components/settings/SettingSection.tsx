
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingSection = ({ title, children }: SettingSectionProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
};
