"use client";

import ScoreRing from "@/components/dashboard/ScoreRing";
import ScoreCard from "@/components/dashboard/ScoreCard";
import GA4Widget from "@/components/GA4Widget";
import GSCWidget from "@/components/GSCWidget";
import AIInsightsCard from "@/components/dashboard/AIInsightsCard";

const mock = {
  overall: 70.4,
  subs: [
    { title: "リーチ力（GSC）", score: 72.1, delta: +2.3, hint: "表示回数/CTR" },
    { title: "入口CTR（GSC）", score: 64.8, delta: +0.9, hint: "クエリ×タイトル適合" },
    { title: "回遊性（GA4）", score: 68.5, delta: -1.4, hint: "直帰/継続" },
    { title: "導線効率（GA4）", score: 61.2, delta: +3.2, hint: "CVR/離脱" },
    { title: "伝わり度（ScanGPT）", score: 74.3, delta: +1.1, hint: "コピー/構造" },
    { title: "技術健全性（PSI/GSC）", score: 77.6, delta: -0.8, hint: "LCP/CLS/エラー" },
  ],
  insights: [
    "検索意図AのCTR改善：タイトル先頭に主要ベネフィットを付加",
    "CVファネル途中離脱（/pricing）：CTA周辺の視線誘導を改善",
    "Hero画像がLCPを押し上げ：WebP化＋遅延読み込みを推奨",
  ],
};

// …冒頭のimportとmockはそのまま…

export default function DashboardPage() {
  return (
    <div className="p-6 grid grid-cols-[360px_1fr_1fr] grid-rows-[420px_220px] gap-6 h-[calc(100vh-100px)]">
      {/* 左カラム */}
      <aside className="row-span-2 flex flex-col h-full">
        {/* 総合 */}
        <div className="dmcc-card p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 font-semibold">DMCC 総合スコア</div>
            <a href="/reports" className="text-xs text-[var(--brand-500)] hover:underline">レポートへ</a>
          </div>
          <div className="flex items-center gap-4">
            <ScoreRing score={mock.overall} tone="brand" />
            <div>
              <div className="text-lg font-semibold">
                {mock.overall.toFixed(1)} <span className="text-sm text-gray-500">/100</span>
              </div>
              <div className="dmcc-sub mt-1">GSC / GA4 / ScanGPT の総合評価</div>
            </div>
          </div>
        </div>

        {/* 6スコア（高さ均等） */}
        <div className="flex-1 grid grid-rows-6 gap-2">
          <ScoreCard title="リーチ力（GSC）"       hint="表示回数/CTR"       score={72.1} delta={+2.3} accent="gsc" />
          <ScoreCard title="入口CTR（GSC）"       hint="クエリ×タイトル適合" score={64.8} delta={+0.9} accent="gsc" />
          <ScoreCard title="回遊性（GA4）"         hint="直帰/継続"         score={68.5} delta={-1.4} accent="ga4" />
          <ScoreCard title="導線効率（GA4）"       hint="CVR/離脱"           score={61.2} delta={+3.2} accent="ga4" />
          <ScoreCard title="伝わり度（ScanGPT）"   hint="コピー/構造"       score={74.3} delta={+1.1} accent="gpt" />
          <ScoreCard title="技術健全性（PSI/GSC）" hint="LCP/CLS/エラー"     score={77.6} delta={-0.8} accent="psi" />
        </div>
      </aside>

      {/* 中央上：GA4 */}
      <section className="dmcc-card p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">内部（GA4）</h2>
          <div className="dmcc-sub">直近14日</div>
        </div>
        <div className="flex-1 min-h-0">
          <GA4Widget />
        </div>
      </section>

      {/* 右上：GSC */}
      <section className="dmcc-card p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">入口（GSC）</h2>
          <a href="/reports" className="text-xs text-[var(--brand-500)] hover:underline">詳細</a>
        </div>
        <div className="flex-1 min-h-0">
          <GSCWidget />
        </div>
      </section>

      {/* 下段：GPT */}
      <section className="col-span-2 dmcc-card p-4 overflow-auto">
        <AIInsightsCard bullets={mock.insights} />
      </section>
    </div>
  );
}