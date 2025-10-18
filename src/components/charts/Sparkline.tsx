"use client";

type Point = number;

export default function Sparkline({
  data,
  height = 48,
  className = "",
}: {
  data: Point[];
  height?: number;
  className?: string;
}) {
  if (!data?.length) return null;
  const w = 160; // 固定幅（カード内想定）
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);

  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastY = h - ((data[data.length - 1] - min) / span) * h;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full ${className}`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {/* 終点のドット */}
      <circle cx={w} cy={lastY} r="3" className="fill-current" />
    </svg>
  );
}