"use client";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import KPIWidget from "@/components/KPIWidget";

export default function Home() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboard();
        setKpis(data.kpis || []);
        setRecs(data.recommendations || []);
        setSamples(data.latestSamples || []);
        setErr(null);
      } catch (e: any) {
        setErr("ダッシュボード取得失敗");
        console.error(e);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">司令デッキ</h1>
      {err && <div className="text-red-600 mb-4">{err}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {kpis.map((k, i) => (
          <KPIWidget key={i} label={k.label} value={k.value} target={k.target} />
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">推奨施策</h2>
        <ul className="list-disc list-inside">
          {recs.map((r) => (
            <li key={r.id}>
              <div className="font-medium">{r.title}</div>
              {r.description && <div className="text-sm text-gray-600">{r.description}</div>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">最新サンプル</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samples.map((s) => (
            <div key={s.id} className="border rounded-md p-4 bg-white shadow-sm">
              <div className="text-sm text-gray-500">{s.date}</div>
              <div className="text-lg font-semibold">{s.title}</div>
              <div className="mt-2 text-gray-700">{s.summary}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
