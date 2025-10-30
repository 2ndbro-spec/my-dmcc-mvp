// src/app/dashboard/page.tsx

"use client";

import useSWR from "swr";
import ScoreRing from "@/components/dashboard/ScoreRing";
import ScoreCard from "@/components/dashboard/ScoreCard";
import AIInsightsCard from "@/components/dashboard/AIInsightsCard";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function toNums(rows: any[], idx: number) {
  return rows.map((r) => Number(r.metricValues[idx]?.value || 0));
}

function percentDelta(curr: number, prev: number) {
  if (!isFinite(curr) || !isFinite(prev) || prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default function DashboardPage() {
  const { data: ga4, isLoading: loadingGA4, error: errorGA4 } = useSWR("/api/ga4/query", fetcher);
  const { data: gsc, isLoading: loadingGSC, error: errorGSC } = useSWR("/api/gsc/query", fetcher);

  const rowsGA4 = ga4?.rows ?? [];
  const rowsGSC = gsc?.rows ?? [];

  const sessions = toNums(rowsGA4, 0);
  const users = toNums(rowsGA4, 1);
  const currSessions = sum(sessions.slice(-7));
  const prevSessions = sum(sessions.slice(-14, -7));
  const currUsers = sum(users.slice(-7));
  const prevUsers = sum(users.slice(-14, -7));
  const dSessions = percentDelta(currSessions, prevSessions);
  const dUsers = percentDelta(currUsers, prevUsers);

  const subs = [
    { title: "リーチ力（GSC）", score: 72.1, delta: 2.3, hint: "表示回数/CTR" },
    { title: "入口CTR（GSC）", score: 64.8, delta: 0.9, hint: "クエリ×タイトル適合" },
    { title: "回遊性（GA4）", score: 68.5, delta: -1.4, hint: "直帰/継続" },
    { title: "導線効率（GA4）", score: 61.2, delta: 3.2, hint: "CVR/離脱" },
    { title: "伝わり度（ScanGPT）", score: 74.3, delta: 1.1, hint: "コピー/構造" },
    { title: "技術健全性（PSI/GSC）", score: 77.6, delta: -0.8, hint: "LCP/CLS/エラー" },
  ];

  return (
    <div className="grid gap-6">
      <ScoreRing />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subs.map((item, i) => (
          <ScoreCard
            key={i}
            title={item.title}
            score={item.score}
            delta={item.delta}
            hint={item.hint}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border overflow-hidden">
          <div className="p-3 border-b font-semibold text-sm">内部（GA4）</div>
          <div className="grid grid-cols-2 text-sm text-center">
            <div className="p-3">
              <div className="text-gray-500">Sessions（直近7日）</div>
              <div className="text-2xl font-bold">{currSessions.toLocaleString()}</div>
              <div className="text-xs text-gray-500">前週比 {dSessions.toFixed(1)}%</div>
            </div>
            <div className="p-3">
              <div className="text-gray-500">Users（直近7日）</div>
              <div className="text-2xl font-bold">{currUsers.toLocaleString()}</div>
              <div className="text-xs text-gray-500">前週比 {dUsers.toFixed(1)}%</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Sessions</th>
                  <th className="px-3 py-2 text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {rowsGA4.map((r: any, i: number) => {
                  const date = r.dimensionValues[0]?.value ?? "-";
                  const s = Number(r.metricValues[0]?.value || 0);
                  const u = Number(r.metricValues[1]?.value || 0);
                  return (
                    <tr key={date + i} className="border-t">
                      <td className="px-3 py-2">{date}</td>
                      <td className="px-3 py-2 text-right">{s.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{u.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="p-3 border-b font-semibold text-sm">入口（GSC）</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Query</th>
                  <th className="px-3 py-2 text-right">Clicks</th>
                  <th className="px-3 py-2 text-right">Impr.</th>
                  <th className="px-3 py-2 text-right">CTR</th>
                  <th className="px-3 py-2 text-right">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {rowsGSC.map((r: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{r.query}</td>
                    <td className="px-3 py-2 text-right">{r.clicks.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{r.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{(r.ctr * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{r.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AIInsightsCard />
    </div>
  );
}