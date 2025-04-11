
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export function SideNavHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="h-16 flex items-center justify-between px-4 border-b">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
          VC
        </div>
        <span className="font-semibold text-lg tracking-tight">
          VortexCore
        </span>
      </div>
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:flex hidden"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
