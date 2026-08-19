import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { BulkRecipientInput } from "@/hooks/use-bulk-payments";
import type { TierKey } from "@/lib/subscription-tiers";

interface RecipientRow {
  id: string;
  recipient: string;
  amount: string;
  notes: string;
}

const createEmptyRow = (): RecipientRow => ({
  id: crypto.randomUUID(),
  recipient: "",
  amount: "",
  notes: ""
});

interface ParsedCsvResult {
  rows: RecipientRow[];
  errors: string[];
}

const parseRecipientsCsv = (text: string): ParsedCsvResult => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const startIndex = /^recipient\s*,\s*amount/i.test(lines[0] ?? "") ? 1 : 0;
  const rows: RecipientRow[] = [];
  const errors: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const [recipient, amountRaw, notes] = lines[i].split(",").map((part) => part?.trim() ?? "");
    const amount = Number(amountRaw);

    if (!recipient) {
      errors.push(`Line ${i + 1}: missing recipient`);
      continue;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Line ${i + 1}: invalid amount "${amountRaw ?? ""}"`);
      continue;
    }

    rows.push({ id: crypto.randomUUID(), recipient, amount: String(amount), notes: notes ?? "" });
  }

  return { rows, errors };
};

interface BulkPaymentFormProps {
  tier: TierKey;
  recipientLimit: number;
  walletBalance: number | null;
  isSubmitting: boolean;
  onSubmit: (items: BulkRecipientInput[]) => Promise<void>;
}

export const BulkPaymentForm = ({
  tier,
  recipientLimit,
  walletBalance,
  isSubmitting,
  onSubmit
}: BulkPaymentFormProps) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [rows, setRows] = useState<RecipientRow[]>([createEmptyRow(), createEmptyRow()]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const updateRow = (id: string, patch: Partial<RecipientRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    if (rows.length >= recipientLimit) return;
    setRows((current) => [...current, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const { rows: parsedRows, errors } = parseRecipientsCsv(text);
    setCsvErrors(errors);

    if (parsedRows.length) {
      setRows(parsedRows.slice(0, recipientLimit));
      if (parsedRows.length > recipientLimit) {
        toast({
          title: `Only the first ${recipientLimit} recipients were loaded`,
          description: `Your ${tier} plan allows up to ${recipientLimit} recipients per batch.`
        });
      }
    }
  };

  const validRows = rows.filter((row) => row.recipient.trim() && Number(row.amount) > 0);
  const totalAmount = validRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const atLimit = rows.length >= recipientLimit;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalidRows = rows.filter((row) => row.recipient.trim() || row.amount.trim());
    const badRow = invalidRows.find(
      (row) => !row.recipient.trim() || !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0
    );

    if (badRow) {
      toast({
        title: "Check your recipients",
        description: "Every row needs a recipient and an amount greater than zero.",
        variant: "destructive"
      });
      return;
    }

    if (!validRows.length) {
      toast({
        title: "Add at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (validRows.length > recipientLimit) {
      toast({
        title: `Batch too large for the ${tier} plan`,
        description: `Reduce to ${recipientLimit} recipients or upgrade to send more at once.`,
        variant: "destructive"
      });
      return;
    }

    await onSubmit(
      validRows.map((row) => ({
        recipient: row.recipient.trim(),
        amount: Number(row.amount),
        notes: row.notes.trim() || undefined
      }))
    );

    setRows([createEmptyRow(), createEmptyRow()]);
    setCsvErrors([]);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>New batch</CardTitle>
            <CardDescription>
              Add recipients manually or import a CSV (recipient,amount,notes)
            </CardDescription>
          </div>
          <Badge variant="outline">
            {rows.length}/{Number.isFinite(recipientLimit) ? recipientLimit : "∞"} recipients
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleCsvFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </Button>
            {!Number.isFinite(recipientLimit) ? null : (
              <span className="text-xs text-muted-foreground">
                {tier === "free"
                  ? "Free plan: up to 5 recipients per batch."
                  : `${tier === "pro" ? "Pro" : "Enterprise"} plan: up to ${recipientLimit} recipients per batch.`}
              </span>
            )}
          </div>

          {csvErrors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-destructive mb-1">
                <AlertCircle className="h-4 w-4" />
                {csvErrors.length} row(s) skipped
              </div>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                {csvErrors.slice(0, 5).map((err) => (
                  <li key={err}>{err}</li>
                ))}
                {csvErrors.length > 5 && <li>...and {csvErrors.length - 5} more</li>}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr_auto] gap-2 items-start">
                <div className="space-y-1">
                  {index === 0 && <Label className="text-xs">Recipient</Label>}
                  <Input
                    value={row.recipient}
                    onChange={(event) => updateRow(row.id, { recipient: event.target.value })}
                    placeholder="Name or account"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && <Label className="text-xs">Amount</Label>}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    onChange={(event) => updateRow(row.id, { amount: event.target.value })}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  {index === 0 && <Label className="text-xs">Notes (optional)</Label>}
                  <Input
                    value={row.notes}
                    onChange={(event) => updateRow(row.id, { notes: event.target.value })}
                    placeholder="Reference or memo"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={index === 0 ? "mt-6" : ""}
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1 || isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={atLimit || isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add recipient
          </Button>

          {atLimit && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-center justify-between gap-3">
              <span>
                You've reached the {recipientLimit}-recipient limit for the {tier} plan.
              </span>
              {tier !== "enterprise" && (
                <Button type="button" size="sm" variant="outline" onClick={() => navigate("/settings")}>
                  Upgrade
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Total for {validRows.length} recipient(s): </span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              {walletBalance !== null && totalAmount > walletBalance && (
                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                  Exceeds wallet balance ({formatCurrency(walletBalance)})
                </span>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting || !validRows.length}>
              {isSubmitting ? "Submitting..." : "Submit batch"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
