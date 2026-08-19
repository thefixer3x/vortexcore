import { useTranslation } from "react-i18next";
import { InsightsHeader } from "@/components/insights/InsightsHeader";
import { AIInsightsDashboard } from "@/components/dashboard/AIInsightsDashboard";

const Insights = () => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <InsightsHeader
        title={t("insights.title")}
        description={t("insights.description")}
      />

      <AIInsightsDashboard />
    </div>
  );
};

export default Insights;
