import { useTranslation } from "react-i18next";
import { VirtualCardManager } from "@/components/cards/VirtualCardManager";
import { Link } from "react-router-dom";
import { Home, ShieldCheck } from "lucide-react";

export default function VirtualCards() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={t("common.actions.back")}
            >
              <Home className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{t("virtual_cards.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("virtual_cards.page_description")}
          </p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm">
            {t("virtual_cards.security_banner")}
          </p>
        </div>
      </div>

      <VirtualCardManager />
    </div>
  );
}