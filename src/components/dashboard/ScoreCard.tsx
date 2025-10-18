"use client";

type Accent = "gsc" | "ga4" | "gpt" | "psi";

const accentMap: Record<Accent, string> = {
  gsc: "border-l-[6px] border-l-sky-500",
  ga4: "border-l-[6px] border-l-emerald-500",
  gpt: "border-l-[6px] border-l-fuchsia-500",
  psi: "border-l-[6px] border-l-amber-500",
};

export default function ScoreCard({
  title, hint, score, delta, accent = "gsc",
}: {
  title: string;
  hint?: string;
  score: number;
  delta?: number;
  accent?: Accent;
}) {
  const tone = delta == null ? "badge"
    : delta > 0 ? "badge-good"
    : delta < 0 ? "badge-bad"
    : "badge";

  return (
    <div className={`dmcc-card p-3 flex items-center justify-between ${accentMap[accent]}`}>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800 truncate">{title}</div>
        {hint && <div className="dmcc-sub truncate">{hint}</div>}
      </div>
      <div className="text-right ml-3 shrink-0">
        <div className="text-lg font-bold">{score.toFixed(1)}</div>
        {delta != null && (
          <span className={`badge ${tone}`}>{delta>0?"+":""}{delta.toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
}