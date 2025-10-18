"use client";

export default function KpiMini({
  label, value, trend = 0,
}: { label: string; value: string | number; trend?: number }) {
  const up = trend > 0, down = trend < 0;
  const badge = up ? "bg-emerald-100 text-emerald-700" :
               down ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600";
  const sign = up ? "+" : down ? "−" : "";
  return (
    <div className="rounded-lg border bg-white p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${badge}`}>{sign}{Math.abs(trend).toFixed(1)}%</span>
    </div>
  );
}