import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DashboardWallet } from "@/hooks/use-dashboard-data";
import {
  DASHBOARD_ACTIONS,
  DashboardActionType
} from "./action-config";

interface DashboardActionDialogProps {
  action: DashboardActionType | null;
  open: boolean;
  onClose: () => void;
  wallets: DashboardWallet[];
  onSuccess: () => Promise<void> | void;
}

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(value);
  } catch (error) {
    console.warn("Unable to format currency", error);
    return `${currency} ${value.toFixed(2)}`;
  }
};

export const DashboardActionDialog = ({
  action,
  open,
  onClose,
  wallets,
  onSuccess
}: DashboardActionDialogProps) => {
  const { user } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [counterparty, setCounterparty] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionConfig = useMemo(() => (action ? DASHBOARD_ACTIONS[action] : null), [action]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultWalletId = wallets[0]?.id ?? "";
    setSelectedWallet(defaultWalletId);
    setCounterparty("");
    setAmount("");
    setNotes("");
    setIsSubmitting(false);
  }, [open, wallets]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!actionConfig || !action) {
      return;
    }

    if (!user?.id) {
      toast({
        title: "You need to be signed in",
        description: "Please log in again to continue",
        variant: "destructive"
      });
      return;
    }

    if (!selectedWallet) {
      toast({
        title: "Select a wallet",
        description: "Choose the wallet you want to use for this action"
      });
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Enter a valid amount",
        description: "Amount must be greater than zero",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const wallet = wallets.find((item) => item.id === selectedWallet);

    try {
      const metadata: Record<string, unknown> = {
        action,
        category: actionConfig.category
      };

      if (counterparty) {
        metadata.counterparty = counterparty;
      }

      if (notes) {
        metadata.notes = notes;
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet?.id ?? null,
        type: actionConfig.transactionType,
        status: actionConfig.defaultStatus,
        amount: numericAmount,
        currency: wallet?.currency ?? "USD",
        reference: `VC-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: notes ? `${actionConfig.label}: ${notes}` : actionConfig.label,
        metadata
      });

      if (error) {
        throw error;
      }

      toast({
        title: actionConfig.successMessage,
        description: `${formatCurrency(numericAmount, wallet?.currency ?? "USD")} processed`
      });

      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to execute dashboard action", error);
      toast({
        title: "Unable to complete action",
        description:
          error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!actionConfig) {
    return null;
  }

  const walletOptions = wallets.map((wallet) => ({
    id: wallet.id,
    label: `${wallet.currency} Wallet`,
    balance: wallet.balance
  }));

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionConfig.label}</DialogTitle>
          <DialogDescription>{actionConfig.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet</Label>
            <Select
              value={selectedWallet}
              onValueChange={(value) => setSelectedWallet(value)}
              disabled={!walletOptions.length || isSubmitting}
            >
              <SelectTrigger id="wallet">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {walletOptions.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex flex-col">
                      <span>{wallet.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(wallet.balance, wallets.find((item) => item.id === wallet.id)?.currency ?? "USD")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterparty">{actionConfig.counterpartyLabel}</Label>
            <Input
              id="counterparty"
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              placeholder={actionConfig.counterpartyPlaceholder}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" value={actionConfig.defaultStatus} readOnly disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add an optional message"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !walletOptions.length}>
              {isSubmitting ? "Processing..." : actionConfig.label}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

