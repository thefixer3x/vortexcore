import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  metadata: { payments?: Array<{ amount: number; paid_at: string; method: string }> } | null;
}

export interface FeedEvent {
  id: string;
  kind: "transaction" | "matched" | "paid" | "detected" | string;
  message: string;
  amount: number | null;
  currency: string | null;
  created_at: string;
}

const SOON_DAYS = 7;
/** Minimum gap between automatic AI re-scans triggered by new transactions. */
export const AUTO_DETECT_COOLDOWN_MS = 2 * 60 * 1000;

export const classifyObligation = (o: Pick<Obligation, "status" | "due_date">): "overdue" | "soon" | "paid" | "upcoming" => {
  if (o.status === "paid") return "paid";
  if (!o.due_date) return "upcoming";
  const diff = (new Date(o.due_date).getTime() - Date.now()) / 86400000;
  if (diff < 0) return "overdue";
  if (diff <= SOON_DAYS) return "soon";
  return "upcoming";
};

const COLS = "id,title,description,category,amount,currency,due_date,recurrence,status,source,confidence,metadata";

export const useObligations = (opts: { live?: boolean } = {}) => {
  const { user } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAuto = useRef(0);
  const detectingRef = useRef(false);

  const load = useCallback(async () => {
    if (!user) { setObligations([]); setIsLoading(false); return; }
    const { data, error } = await supabase
      .from("vortex_obligations" as never)
      .select(COLS)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) setError(error.message);
    else { setError(null); setObligations((data ?? []) as unknown as Obligation[]); }
    setIsLoading(false);
  }, [user]);

  const loadFeed = useCallback(async () => {
    if (!user || !opts.live) return;
    const { data } = await supabase
      .from("vortex_obligation_feed" as never)
      .select("id,kind,message,amount,currency,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setFeed((data ?? []) as unknown as FeedEvent[]);
  }, [user, opts.live]);

  useEffect(() => { load(); loadFeed(); }, [load, loadFeed]);

  const detect = useCallback(async () => {
    detectingRef.current = true;
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-obligations", { body: {} });
      if (error) throw new Error((data as { error?: string })?.error || "Detection failed");
      await load();
      return data as { created: number; scanned: number; message?: string };
    } finally { detectingRef.current = false; setIsDetecting(false); }
  }, [load]);

  // Live updates: obligations change on screen immediately; new unmatched
  // transactions trigger a throttled background AI re-scan.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`obligations-${user.id}-${opts.live ? "live" : "summary"}`)
      // Live events come from the real tables in app_vortexcore (public only has views).
      .on("postgres_changes", { event: "*", schema: "app_vortexcore", table: "vortex_obligations", filter: `user_id=eq.${user.id}` }, () => { load(); })
      .on("postgres_changes", { event: "INSERT", schema: "app_vortexcore", table: "vortex_obligation_feed", filter: `user_id=eq.${user.id}` }, (payload) => {
        if (!opts.live) return;
        const ev = payload.new as FeedEvent;
        setFeed((f) => [ev, ...f].slice(0, 20));
        if (ev.kind === "transaction" && !detectingRef.current && Date.now() - lastAuto.current > AUTO_DETECT_COOLDOWN_MS) {
          lastAuto.current = Date.now();
          detect().catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, opts.live, load, detect]);

  /** Upload a bank statement; the server adds transactions and runs VortexAI detection itself. */
  const importStatement = useCallback(async (file: File, currency?: string) => {
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isCsv = /\.(csv|txt)$/i.test(file.name) || file.type === "text/csv";
    if (!isPdf && !isCsv) throw new Error("Upload a CSV or PDF bank statement.");
    if (file.size === 0) throw new Error("The file is empty.");
    if (file.size > (isPdf ? 7 : 2) * 1024 * 1024) throw new Error(`That file is too large (max ${isPdf ? 7 : 2} MB).`);
    const body: Record<string, unknown> = { file_name: file.name, file_type: isPdf ? "pdf" : "csv" };
    if (currency) body.currency = currency;
    if (isPdf) {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      body.data_base64 = btoa(bin);
    } else {
      body.content = await file.text();
    }
    // The server runs detection on the imported rows, so pause the client's auto re-scan.
    detectingRef.current = true;
    lastAuto.current = Date.now();
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-statement", { body });
      if (error) {
        let msg = (data as { error?: string })?.error;
        try { msg = msg || (await (error as { context?: Response }).context?.json())?.error; } catch { /* ignore */ }
        throw new Error(msg || "Import failed");
      }
      await Promise.all([load(), loadFeed()]);
      return data as { imported: number; duplicates: number; skipped: number; matched: number; obligations_created: number; currency: string; detection_error?: string };
    } finally {
      lastAuto.current = Date.now();
      detectingRef.current = false;
      setIsDetecting(false);
    }
  }, [load, loadFeed]);

  const pay = useCallback(async (id: string) => {
    const { data, error } = await supabase.functions.invoke("pay-obligation", { body: { obligation_id: id } });
    if (error) {
      let msg = (data as { error?: string })?.error;
      try { msg = msg || (await (error as { context?: Response }).context?.json())?.error; } catch { /* ignore */ }
      throw new Error(msg || "Payment failed");
    }
    await load();
    return data as { amount: number; currency: string; paid_at: string; new_balance: number };
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

  return { obligations, feed, summary, isLoading, isDetecting, error, detect, importStatement, pay, markPaid, remove, refresh: load };
};
