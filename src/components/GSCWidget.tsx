"use client";

import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Row = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export default function GSCWidget() {
  const { data, error, isLoading } = useSWR<{ rows: Row[] }>("/api/gsc/query", fetcher);

  if (isLoading) return <div className="text-sm text-gray-500">📈 入口データを取得中…</div>;
  if (error) return <div className="text-sm text-rose-600">❌ 取得エラー</div>;
  const rows = data?.rows ?? [];

  return (
    <div className="grid gap-3">
      <div className="text-sm text-gray-600">
        上位/下位クエリのCTRと平均掲載順位。タイトル/ディスクリプションの適合度を評価。
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
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
            {rows.map((r, i) => (
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
  );
}