"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Row = { ts: string; sessions: number };

export default function HistoryChartPrint({ rows }: { rows: Row[] }) {
  const data = (rows ?? []).map((r) => ({
    x: r.ts?.slice(5, 10) ?? "",
    y: Number(r.sessions ?? 0),
  }));

  // ResponsiveContainer を使わず "確実に描く"
  return (
    <div style={{ width: 860, height: 260 }}>
      <LineChart width={860} height={260} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="y" stroke="#2563eb" dot={{ r: 3 }} />
      </LineChart>
    </div>
  );
}