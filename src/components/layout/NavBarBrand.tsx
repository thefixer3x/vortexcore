
import { Link } from "react-router-dom";

export function NavBarBrand() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
        VC
      </div>
      <span className="font-semibold text-lg tracking-tight">
        VortexCore
      </span>
    </div>
  );
}
