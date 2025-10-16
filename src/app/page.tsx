// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { ScanResponse, ScanRecord } from "@/lib/types";
import { fetchWithTO } from "@/lib/fetcher";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
} from "recharts";
import { Spark } from "@/components/Spark";
import { Scheduler } from "@/components/Scheduler";
import dynamic from "next/dynamic";
  const HistoryChart = dynamic(() => import("@/components/HistoryChart"), { ssr: false });
export default function Page() {
  const [targetUrl, setTargetUrl] = useState("https://puenteoffice.wordpress.com/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  // KPI / レーダー
  const [kpi, setKpi] = useState<ScanResponse["kpi"]>({
    sessions: 0,
    cvRate: 0,
    bounceRate: 0,
    avgTime: "0:00",
  });
  const [radar, setRadar] = useState<ScanResponse["radar"]>([]);

  // 履歴
  const [history, setHistory] = useState<ScanRecord[]>([]);

  // ------------------ アクション ------------------

  // 1) 手動診断
  const runScan = async () => {
    try {
      setLoading(true);
      setError(null);

      // 診断実行
      const res = await fetchWithTO(
        "/api/scan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        },
        15000
      );
      if (!res.ok) throw new Error("scan api failed");

      const raw = (await res.json()) as any;

      // 出所
      setSource(String(raw?.source ?? "api"));

      // 正規化
      const normalized = {
        kpi: {
          sessions: Number(raw?.kpi?.sessions ?? 0),
          cvRate: Number(raw?.kpi?.cvRate ?? 0),
          bounceRate: Number(raw?.kpi?.bounceRate ?? 0),
          avgTime: String(raw?.kpi?.avgTime ?? "0:00"),
        },
        radar: Array.isArray(raw?.radar)
          ? raw.radar.map((r: any) => ({
              subject: String(r?.subject ?? ""),
              score: Number(r?.score ?? 0),
            }))
          : [],
      };

      setKpi(normalized.kpi);
      setRadar(normalized.radar);

      // 履歴保存（JSONL）
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          kpi: normalized.kpi,
          radar: normalized.radar,
          ts: new Date().toISOString(),
          version: "dmcc-1",
        }),
      });

      // 履歴再取得
      await loadHistory(targetUrl);
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  };

  // 2) 履歴取得
  const loadHistory = async (url: string) => {
    const r = await fetch(`/api/history?url=${encodeURIComponent(url)}&limit=20`);
    if (r.ok) setHistory(await r.json());
  };

  useEffect(() => {
    loadHistory(targetUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUrl]);

  // 3) レポート（PDF）を開く
  const openReport = async (period: "daily" | "weekly" | "monthly") => {
    try {
      // URLが空白ならエラー回避
      if (!targetUrl?.trim()) {
        alert("URLを入力してからレポートを開いてください。");
        return;
      }

      const res = await fetch(
        `/api/report/${period}?url=${encodeURIComponent(targetUrl.trim())}`,
        { method: "GET" }
      );

      if (!res.ok) {
        alert("履歴がありません。診断を実行してください。");
        console.warn("Report API returned:", res.status);
        return;
      }

      // blobをPDFに変換して新しいタブで開く
      const blob = await res.blob();
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, "_blank");

      // メモリ開放（10秒後にURL破棄）
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (e) {
      alert("レポート生成中にエラーが発生しました");
      console.error("[openReport error]", e);
    }
  };

  // 4) PDF（react-pdf版）ダウンロード（既存のまま残すなら）
  const exportPDF = async () => {
    const r = await fetch("/api/exportPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    });
    if (!r.ok) return alert("PDF出力に失敗しました");
    const blob = await r.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "DMCC_Report.pdf";
    a.click();
    URL.revokeObjectURL(href);
  };

  // ------------------ ビュー用整形 ------------------

  const hasHistory = Array.isArray(history) && history.length > 0;

  // 履歴チャート（古い→新しい）
  const series = (hasHistory ? history : [])
    .filter((h) => h && h.kpi)
    .slice()
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((h) => ({
      ts: new Date(h.ts).toLocaleDateString("ja-JP"),
      sessions: Number(h.kpi?.sessions ?? 0),
      cv: Number(h.kpi?.cvRate ?? 0),
      bounce: Number(h.kpi?.bounceRate ?? 0),
    }));

  // スパークライン
  const sparkSessions = history.slice(-8).map((h) => Number(h?.kpi?.sessions ?? 0)).reverse();
  const sparkCv = history.slice(-8).map((h) => Number(h?.kpi?.cvRate ?? 0)).reverse();
  const sparkBounce = history.slice(-8).map((h) => Number(h?.kpi?.bounceRate ?? 0)).reverse();

  // レーダー
  const radarData = (radar ?? []).map((r) => ({ subject: r.subject, A: Number(r.score ?? 0) }));

  // ------------------ UI ------------------

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
      {/* ヘッダー */}
      <header className="flex flex-wrap gap-3 items-center px-6 py-4 border-b border-gray-300 dark:border-gray-800">
        <h1 className="text-xl font-bold">DMCC Dashboard</h1>

        {/* URL入力 */}
        <input
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="flex-1 min-w-[260px] max-w-xl px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          placeholder="https://example.com"
        />

        {/* 手動診断 */}
        <button
          onClick={runScan}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
        >
          {loading ? "診断中…" : "診断"}
        </button>

        {/* PDF（react-pdf 版） */}
        <button onClick={() => openReport("weekly")}>PDF出力</button>

        {/* スケジューラ */}
        <div className="ml-auto">
          <Scheduler targetUrl={targetUrl} />
        </div>
      </header>

      <main className="p-6 grid gap-6 max-w-6xl mx-auto">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
            エラー: {error}（再試行してください）
          </div>
        )}

        {/* レポート（pdf-lib 版） */}
        <section className="flex gap-2">
          <button onClick={() => openReport("daily")}>日次レポート</button>
          <button onClick={() => openReport("weekly")}>週次レポート</button>
          <button onClick={() => openReport("monthly")}>月次レポート</button>
        </section>

        {/* KPIカード + スパークライン */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">セッション数</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{Number(kpi?.sessions ?? 0).toLocaleString()}</p>
              <Spark data={sparkSessions} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">CV率</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{Number(kpi?.cvRate ?? 0)}%</p>
              <Spark data={sparkCv} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">直帰率</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{Number(kpi?.bounceRate ?? 0)}%</p>
              <Spark data={sparkBounce} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">平均滞在時間</p>
            <p className="text-2xl font-bold">{kpi?.avgTime ?? "0:00"}</p>
          </div>
        </section>

        {/* 履歴（過去との比較） */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-3">履歴（過去との比較）</h2>
          {!hasHistory && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              まだ履歴がありません。診断を実行するとここに蓄積されます。
            </p>
          )}
          <div className="w-full h-64">
            <ResponsiveContainer>
              <LineChart data={series}>
                <XAxis dataKey="ts" />
                <YAxis />
                <Tooltip />
                <Line dataKey="sessions" name="セッション" strokeWidth={2} />
                <Line dataKey="cv" name="CV率" strokeWidth={2} />
                <Line dataKey="bounce" name="直帰率" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 総合スコア（レーダー） */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-3">総合スコア（レーダー）</h2>
          <div className="w-full h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <RechartsRadar name="Score" dataKey="A" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}