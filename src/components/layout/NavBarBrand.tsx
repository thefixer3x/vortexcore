
import { Link } from "react-router-dom";

export function NavBarBrand() {
  return (
    <Link 
      to="/dashboard" 
      className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      title="Return to Dashboard"
    >
      <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
        VC
      </div>
      <span className="font-semibold text-lg tracking-tight">
        VortexCore
      </span>
    </Link>
  );
}
