import { Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export function SideNavProfile() {
  const { user, isLoading } = useAuth();
  const { currency } = useCurrency();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium mb-2">
        {isLoading ? "…" : initials || "?"}
      </div>
      <h3 className="font-medium text-foreground">
        {isLoading ? "Loading…" : displayName}
      </h3>
      <p className="text-sm text-muted-foreground">
        {user?.email || ""}
      </p>
      <div className="mt-2 text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1">
        <Globe className="h-3 w-3" />
        <span>Default Currency: <span className="font-medium">{currency} NGN</span></span>
      </div>
    </div>
  );
}