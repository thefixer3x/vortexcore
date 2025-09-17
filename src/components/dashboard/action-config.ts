import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  CreditCard,
  Send,
  Zap
} from "lucide-react";

export type DashboardActionType = "send" | "request" | "pay_bills" | "top_up";

export interface DashboardActionConfig {
  key: DashboardActionType;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  iconColor: string;
  transactionType: "deposit" | "withdrawal" | "transfer" | "payment";
  defaultStatus: "pending" | "completed";
  category: string;
  counterpartyLabel: string;
  counterpartyPlaceholder: string;
  successMessage: string;
}

export const DASHBOARD_ACTIONS: Record<DashboardActionType, DashboardActionConfig> = {
  send: {
    key: "send",
    label: "Send Money",
    description: "Transfer to any account",
    icon: Send,
    gradient: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    transactionType: "transfer",
    defaultStatus: "pending",
    category: "Transfer",
    counterpartyLabel: "Recipient",
    counterpartyPlaceholder: "Who are you sending to?",
    successMessage: "Transfer initiated successfully"
  },
  request: {
    key: "request",
    label: "Request Money",
    description: "Generate payment link",
    icon: ArrowDownRight,
    gradient: "from-green-500 to-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    transactionType: "deposit",
    defaultStatus: "pending",
    category: "Request",
    counterpartyLabel: "From",
    counterpartyPlaceholder: "Who should send funds?",
    successMessage: "Money request recorded"
  },
  pay_bills: {
    key: "pay_bills",
    label: "Pay Bills",
    description: "Utilities & subscriptions",
    icon: CreditCard,
    gradient: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    transactionType: "payment",
    defaultStatus: "completed",
    category: "Bills",
    counterpartyLabel: "Biller",
    counterpartyPlaceholder: "E.g. Electricity Company",
    successMessage: "Bill payment recorded"
  },
  top_up: {
    key: "top_up",
    label: "Mobile Top-up",
    description: "Airtime & data bundles",
    icon: Zap,
    gradient: "from-orange-500 to-orange-600",
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    transactionType: "deposit",
    defaultStatus: "completed",
    category: "Top Up",
    counterpartyLabel: "Provider",
    counterpartyPlaceholder: "Mobile network or service",
    successMessage: "Top up successful"
  }
};

export const DASHBOARD_ACTION_ORDER: DashboardActionType[] = [
  "send",
  "request",
  "pay_bills",
  "top_up"
];

