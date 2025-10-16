"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function ReportPreview() {
  const sp = useSearchParams();
  const url = sp.get("url") ?? "";

  const [history, setHistory] = useState<any[]>([]);
  const [radar, setRadar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!url) return;
      setLoading(true);
      try {
        const h = await fetch(`/api/history?url=${encodeURIComponent(url)}&limit=30`).then(r => r.json());
        setHistory(Array.isArray(h) ? h : []);
        // API は新しい順で返す想定。なければ空配列。
        setRadar((Array.isArray(h) && h[0]?.radar) ? h[0].radar : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  const series = useMemo(() => (
    (history ?? [])
      .slice()
      .sort((a, b) => a.ts.localeCompare(b.ts)) // 古い→新しい
      .map(h => ({
        ts: new Date(h.ts).toLocaleDateString("ja-JP"),
        sessions: Number(h.kpi?.sessions ?? 0),
        cv: Number(h.kpi?.cvRate ?? 0),
        bounce: Number(h.kpi?.bounceRate ?? 0),
      }))
  ), [history]);

  const radarData = useMemo(() => (
    (radar ?? []).map((r: any) => ({ subject: String(r.subject ?? ""), A: Number(r.score ?? 0) }))
  ), [radar]);

  return (
    <div style={{ padding: 24, width: 1000, background: "#fff" }}>
      <div id="chart-root">
        {/* 折れ線 */}
        <div style={{ height: 280, marginBottom: 24, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>履歴（セッション/CV/直帰率）</h3>
          <div style={{ width: "100%", height: 220 }}>
            {loading ? null : (
              <ResponsiveContainer>
                <LineChart data={series}>
                  <XAxis dataKey="ts" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="sessions" strokeWidth={2} />
                  <Line dataKey="cv" strokeWidth={2} />
                  <Line dataKey="bounce" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* レーダー */}
        <div style={{ height: 320, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>総合スコア（レーダー）</h3>
          <div style={{ width: "100%", height: 260 }}>
            {loading ? null : (
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Score" dataKey="A" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}