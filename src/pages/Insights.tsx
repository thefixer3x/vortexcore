import { useTranslation } from "react-i18next";
import { InsightsHeader } from "@/components/insights/InsightsHeader";
import AIRecommendations from "@/components/insights/AIRecommendations";

const emptySuggestions: { id: number; title: string; description: string; impact: string; type: string }[] = [];

const Insights = () => {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      <InsightsHeader
        title={t("insights.title")}
        description={t("insights.description")}
      />

      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          <p>No financial data to analyze yet.</p>
        </div>

        <AIRecommendations suggestions={emptySuggestions} />
      </div>
    </div>
  );
};

export default Insights;