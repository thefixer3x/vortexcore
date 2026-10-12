import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Server-verified admin check (never trust client storage for roles). */
export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.functions.invoke("vortex-admin", { body: { action: "whoami" } })
      .then(({ data }) => setIsAdmin(Boolean((data as { is_admin?: boolean })?.is_admin)))
      .catch(() => setIsAdmin(false));
  }, [user]);
  return isAdmin;
};
