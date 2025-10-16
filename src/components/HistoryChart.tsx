"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Row = { ts: string; sessions: number };

export default function HistoryChart({ rows }: { rows: Row[] }) {
  // マウント済み判定（SSR→CSR切り替え時の消失防止）
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // データが空でも枠だけは表示する
  const data = rows?.length
    ? rows.map((r) => ({
        x: r.ts?.slice(5, 10) ?? "",
        y: Number(r.sessions ?? 0),
      }))
    : [];

  return (
    <div className="h-[260px] min-h-[260px] w-full">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#2563eb" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full grid place-items-center text-sm text-slate-400">
          Loading…
        </div>
      )}
    </div>
  );
}