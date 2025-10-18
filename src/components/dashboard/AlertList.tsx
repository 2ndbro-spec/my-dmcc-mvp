"use client";

type Item = { id: string; title: string; severity: "P1"|"P2"|"P3"; hint?: string };

export default function AlertList({ items = [] as Item[] }) {
  const color = (s: Item["severity"]) =>
    s === "P1" ? "bg-rose-100 text-rose-700"
    : s === "P2" ? "bg-amber-100 text-amber-700"
    : "bg-sky-100 text-sky-700";
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">アラート / ミッション</h3>
        <a href="/reports" className="text-xs text-blue-600">すべて見る</a>
      </div>
      <ul className="grid gap-2">
        {items.length ? items.map(x => (
          <li key={x.id} className="flex items-start gap-2">
            <span className={`text-[10px] px-2 py-1 rounded ${color(x.severity)}`}>{x.severity}</span>
            <div>
              <div className="text-sm font-medium">{x.title}</div>
              {x.hint && <div className="text-xs text-gray-500">{x.hint}</div>}
            </div>
          </li>
        )) : <li className="text-sm text-gray-500">現在アラートはありません</li>}
      </ul>
    </div>
  );
}