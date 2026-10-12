import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Obligation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: number | null;
  currency: string;
  due_date: string | null;
  recurrence: string;
  status: string;
  source: string;
  confidence: number | null;
}

const SOON_DAYS = 7;

export const classifyObligation = (o: Obligation): "overdue" | "soon" | "paid" | "upcoming" => {
  if (o.status === "paid") return "paid";
  if (!o.due_date) return "upcoming";
  const diff = (new Date(o.due_date).getTime() - Date.now()) / 86400000;
  if (diff < 0) return "overdue";
  if (diff <= SOON_DAYS) return "soon";
  return "upcoming";
};

export const useObligations = () => {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setObligations([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("vortex_obligations" as never)
      .select("id,title,description,category,amount,currency,due_date,recurrence,status,source,confidence")
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) setError(error.message);
    else { setError(null); setObligations((data ?? []) as unknown as Obligation[]); }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const detect = useCallback(async () => {
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-obligations", { body: {} });
      if (error) throw new Error((data as { error?: string })?.error || "Detection failed");
      await load();
      return data as { created: number; scanned: number; message?: string };
    } finally { setIsDetecting(false); }
  }, [load]);

  const markPaid = useCallback(async (id: string) => {
    await supabase.from("vortex_obligations" as never).update({ status: "paid" } as never).eq("id", id);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("vortex_obligations" as never).delete().eq("id", id);
    await load();
  }, [load]);

  const summary = useMemo(() => {
    const active = obligations.filter((o) => o.status !== "paid");
    return {
      total: active.length,
      overdue: active.filter((o) => classifyObligation(o) === "overdue").length,
      soon: active.filter((o) => classifyObligation(o) === "soon").length,
    };
  }, [obligations]);

  return { obligations, summary, isLoading, isDetecting, error, detect, markPaid, remove, refresh: load };
};
