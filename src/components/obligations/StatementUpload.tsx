import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type ImportResult = {
  imported: number; duplicates: number; skipped: number; matched: number;
  obligations_created: number; currency: string; detection_error?: string;
};

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "ZAR", "KES"];

export function StatementUpload({ onImport, busy }: {
  onImport: (file: File, currency?: string) => Promise<ImportResult>;
  busy: boolean;
}) {
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [currency, setCurrency] = useState("auto");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [last, setLast] = useState<ImportResult | null>(null);

  const handle = async (file: File | undefined) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const r = await onImport(file, currency === "auto" ? undefined : currency);
      setLast(r);
      toast({
        title: r.imported ? `Imported ${r.imported} transactions` : "Nothing new to import",
        description: [
          r.duplicates ? `${r.duplicates} already imported` : "",
          r.matched ? `${r.matched} matched to bills` : "",
          r.obligations_created ? `${r.obligations_created} new obligations found` : "",
          r.detection_error ?? "",
        ].filter(Boolean).join(" · ") || undefined,
      });
    } catch (e) {
      toast({ title: "Couldn't import statement", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  const working = uploading || busy;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-4 w-4 text-primary" /> Import a bank statement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a bank statement file"
          onClick={() => !working && input.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !working) input.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void handle(e.dataTransfer.files?.[0]); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${working ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <FileUp className="h-6 w-6 text-muted-foreground" />}
          <p className="text-sm font-medium">{uploading ? "Reading your statement…" : "Drop a CSV or PDF statement here, or click to choose"}</p>
          <p className="text-xs text-muted-foreground">Transactions are added to your history, matched to your bills, and VortexAI looks for new obligations. Re-uploading the same statement won't add duplicates.</p>
        </div>
        <input ref={input} type="file" accept=".csv,.txt,.pdf,text/csv,application/pdf" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Statement currency</span>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-8 w-[180px]" aria-label="Statement currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Detect (NGN if unsure)</SelectItem>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {last && (
          <p className="text-xs text-muted-foreground">
            Last import: {last.imported} added, {last.duplicates} duplicates, {last.skipped} unreadable rows, {last.matched} matched to bills, {last.obligations_created} new obligations ({last.currency}).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
