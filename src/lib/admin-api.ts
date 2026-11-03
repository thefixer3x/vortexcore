import { supabase } from "@/integrations/supabase/client";

/** Call the server-side admin service (all admin data is read with the server's secret key). */
export async function callAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("vortex-admin", { body });
  if (error) {
    let msg: string | undefined;
    try { msg = (await (error as { context?: Response }).context?.json())?.error; } catch { /* ignore */ }
    throw new Error(msg || "Request failed");
  }
  return data as T;
}

export interface AdminStats {
  totals: {
    vortexcore_users: number; organisation_users: number; organisation_admins: number;
    transactions: number; obligations: number; open_obligations: number; projects: number; wallets: number;
  };
  signups: Array<{ month: string; count: number }>;
  transactions_daily: Array<{ day: string; credit: number; debit: number; count: number }>;
  obligations_by_status: Array<{ status: string; count: number }>;
  obligations_by_category: Array<{ category: string; count: number }>;
  wallets_by_currency: Array<{ currency: string; balance: number; count: number }>;
  plans: Array<{ tier: string; count: number }>;
  platform_apps: Array<{ id: string; name: string; status: string | null; migration_status: string | null; is_active: boolean | null }>;
  recent_audit: Array<{ action: string; details: Record<string, unknown>; user_id: string | null; created_at: string }>;
}
