"use client";

type Props = {
  label: string;
  value: string | number;
  delta?: number; // 前週比など（%）
  children?: React.ReactNode; // スパークラインなど
};

export default function MetricCard({ label, value, delta, children }: Props) {
  const sign = delta == null ? null : delta > 0 ? "+" : delta < 0 ? "−" : "";
  const color =
    delta == null ? "text-gray-500 bg-gray-100"
    : delta > 0 ? "text-emerald-700 bg-emerald-100"
    : delta < 0 ? "text-rose-700 bg-rose-100"
    : "text-gray-700 bg-gray-100";

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        {delta != null && (
          <span className={`text-xs px-2 py-1 rounded-full ${color}`}>
            {sign}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {children}
    </div>
  );
}