import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { BulkBatch } from "@/hooks/use-bulk-payments";

const STATUS_VARIANT: Record<BulkBatch["status"], "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  processing: "secondary",
  failed: "destructive",
  mixed: "outline"
};

interface BulkPaymentHistoryProps {
  batches: BulkBatch[];
  isLoading: boolean;
}

export const BulkPaymentHistory = ({ batches, isLoading }: BulkPaymentHistoryProps) => {
  const { formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-sm text-muted-foreground">Loading batch history...</CardContent>
      </Card>
    );
  }

  if (!batches.length) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <Send className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No bulk payments yet</p>
            <p className="text-sm text-muted-foreground">
              Batches you submit will show up here with per-recipient status.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Batch history</CardTitle>
        <CardDescription>{batches.length} batch(es) submitted from this account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {batches.map((batch) => {
          const isOpen = expanded === batch.batchId;
          return (
            <div key={batch.batchId} className="rounded-lg border">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpanded(isOpen ? null : batch.batchId)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <div>
                    <p className="font-medium text-sm">
                      {batch.items.length} recipient(s) · {formatCurrency(batch.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(batch.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[batch.status]} className="capitalize">
                  {batch.status}
                </Badge>
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batch.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.recipient}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                          <TableCell className="capitalize">{item.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
