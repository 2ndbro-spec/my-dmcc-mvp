"use client";

import useSWR from "swr";
import MetricCard from "./ui/MetricCard";
import Sparkline from "./charts/Sparkline";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Row = {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
};
type RunReport = {
  rows: Row[];
};

function toNums(rows: Row[], idx: number) {
  return rows.map((r) => Number(r.metricValues[idx]?.value || 0));
}

function percentDelta(curr: number, prev: number) {
  if (!isFinite(curr) || !isFinite(prev) || prev === 0) return 0;
  return ((curr - prev) / prev) * 100;
}

export default function GA4Widget() {
  const { data, error, isLoading } = useSWR<RunReport>("/api/ga4/query", fetcher);

  if (isLoading) return <div className="text-sm text-gray-500">📊 読み込み中…</div>;
  if (error) return <div className="text-sm text-rose-600">❌ 取得エラー</div>;
  if (!data?.rows?.length) return <div className="text-sm text-gray-500">データなし</div>;

  const rows = data.rows;
  const sessions = toNums(rows, 0);
  const users = toNums(rows, 1);

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const currSessions = sum(sessions.slice(-7));
  const prevSessions = sum(sessions.slice(-14, -7));
  const currUsers = sum(users.slice(-7));
  const prevUsers = sum(users.slice(-14, -7));

  const dSessions = percentDelta(currSessions, prevSessions);
  const dUsers = percentDelta(currUsers, prevUsers);

  return (
    <div className="grid gap-4">
      {/* 上段：KPIカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard label="Sessions（直近7日）" value={currSessions.toLocaleString()} delta={dSessions}>
          <div className="text-gray-400">
            <Sparkline data={sessions} />
          </div>
        </MetricCard>

        <MetricCard label="Users（直近7日）" value={currUsers.toLocaleString()} delta={dUsers}>
          <div className="text-gray-400">
            <Sparkline data={users} />
          </div>
        </MetricCard>
      </div>

      {/* 下段：テーブル（確認用） */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Sessions</th>
              <th className="px-3 py-2 text-right">Users</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
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
  );
}