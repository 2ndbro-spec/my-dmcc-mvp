// src/app/reports/page.tsx
"use client";

import useSWR from "swr";
import GA4Widget from "@/components/GA4Widget"; // default export 前提

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function Reports() {
  const { data: hist = [] } = useSWR<any[]>("/api/history?limit=200", fetcher);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <a className="btn" href="/report/preview?url=https://example.com">Open PDF Preview</a>
        <a className="btn" href="/api/exportPDF?period=weekly">Export latest PDF</a>
      </div>

      <section className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">GA4データ（モック）</h2>
        <GA4Widget />
      </section>

      <section className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Sessions</th>
              <th className="px-3 py-2 text-left">CVR</th>
              <th className="px-3 py-2 text-left">Bounce</th>
              <th className="px-3 py-2 text-center">Radar</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((h: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{new Date(h.ts).toLocaleString("ja-JP")}</td>
                <td className="px-3 py-2">{h.kpi?.sessions ?? 0}</td>
                <td className="px-3 py-2">{h.kpi?.cvRate ?? 0}%</td>
                <td className="px-3 py-2">{h.kpi?.bounceRate ?? 0}%</td>
                <td className="px-3 py-2 text-center">
                  {(h.radar ?? []).slice(0, 3).map((r: any) => r.subject).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}