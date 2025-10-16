import KpiGauge from "@/components/analysis/KpiGauge";

export default function AnalysisPage() {
  return (
    <div className="p-4 md:p-8 grid gap-6 md:grid-cols-2">
      <KpiGauge label="Core Web Vitals" value={62} />
      <KpiGauge label="SEO Score" value={48} />
    </div>
  );
}