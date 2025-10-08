import ScanCard from "@/components/recon/ScanCard";

export default function ReconPage() {
  return (
    <div className="p-4 md:p-8 grid gap-6">
      <ScanCard
        title="平賀スクエア"
        url="https://hiraga-sq.jp/"
        kpis={[
          { label: "Mobile Perf", value: 55 },
          { label: "Desktop Perf", value: 58 },
          { label: "Backlinks", value: 51 },
          { label: "KW Top", value: 26 },
        ]}
        notes="一次スキャンのサマリ。未取得値は後続で埋める。"
      />
    </div>
  );
}