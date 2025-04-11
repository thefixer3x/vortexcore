
import { Globe } from "lucide-react";

export function SideNavProfile() {
  return (
    <div className="p-6 flex flex-col items-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium mb-2">
        AV
      </div>
      <h3 className="font-medium text-foreground">Alex Volkov</h3>
      <p className="text-sm text-muted-foreground">alex@vortexcore.com</p>
      <div className="mt-2 text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1">
        <Globe className="h-3 w-3" />
        <span>Default Currency: <span className="font-medium">₦ NGN</span></span>
      </div>
    </div>
  );
}
