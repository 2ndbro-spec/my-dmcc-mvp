// src/app/print/[period]/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import HistoryChartPrint from "@/components/HistoryChartPrint"; // ← 固定サイズ版を使う（作成済みの想定）

export default function PrintPage({
  params,
  searchParams,
}: {
  params: { period: string };
  searchParams: { url?: string };
}) {
  const { period } = params;
  const url = searchParams.url ?? "";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = new URLSearchParams({ url, limit: "20" });
        const res = await fetch(`/api/history?${q.toString()}`, { cache: "no-store" });
        const json = res.ok ? await res.json() : [];
        if (alive) setRows(json || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [url]);

  // SVGが本当に存在したら「合図」を出す
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      const root = document.getElementById("chart-root");
      const svg = root?.querySelector("svg");
      if (svg) {
        (window as any).__dmccChartReady = true;            // ← Puppeteerが見るフラグ
        setReady(true);
        clearInterval(t);
      }
    }, 100);
    return () => clearInterval(t);
  }, [loading, rows]);

  const chartRows = useMemo(
    () => rows.map((r) => ({ ts: r.ts, sessions: Number(r.kpi?.sessions ?? 0) })),
    [rows]
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "white", color: "#111", padding: "8px 24px" }}>
      <header style={{ borderBottom: "1px solid #ddd", padding: "0 24px 8px" }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>DMCC Report ({period})</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12 }}>Target: {url || "—"}</p>
      </header>

      <main style={{ padding: "12px 24px 0" }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>履歴（過去との比較）</h3>
        <div id="chart-root" style={{ width: 860, height: 260, border: "1px solid #eee", borderRadius: 8 }}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 100, color: "#999" }}>Loading...</div>
          ) : (
            <HistoryChartPrint rows={chartRows} />
          )}
        </div>

        {/* ← Puppeteerはこの要素の存在でも待機できる */}
        {ready && <div id="chart-ready" style={{ display: "none" }}>ok</div>}
      </main>
    </div>
  );
}