"use client";

type Tone = "brand" | "good" | "fair" | "bad" | "auto";

/**
 * tone:
 *  - "brand" … 常にブランドブルー
 *  - "auto"  … スコアに応じて good/fair/bad を自動判定（既定）
 *  - "good"/"fair"/"bad" … 明示指定
 */
export default function ScoreRing({
  score = 0,
  tone = "auto",
}: {
  score?: number;
  tone?: Tone;
}) {
  const r = 38, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;

  const autoTone =
    tone === "auto"
      ? pct >= 70 ? "good" : pct >= 55 ? "fair" : "bad"
      : tone;

  const toneClass =
    autoTone === "brand" ? "tone-brand" :
    autoTone === "good"  ? "tone-good"  :
    autoTone === "fair"  ? "tone-fair"  :
                           "tone-bad";

  return (
    <svg viewBox="0 0 100 100" className={`w-20 h-20 ${toneClass}`}>
      <circle cx="50" cy="50" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none"/>
      <circle cx="50" cy="50" r={r} stroke="currentColor" strokeWidth="8" fill="none"
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
              transform="rotate(-90 50 50)"/>
      <text x="50" y="56" textAnchor="middle" className="text-[18px] font-semibold fill-gray-900">
        {pct.toFixed(1)}
      </text>
    </svg>
  );
}