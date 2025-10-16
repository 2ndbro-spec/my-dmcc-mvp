// src/components/Spark.tsx
"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export function Spark({ data }: { data: number[] }) {
  const rows = data.map((y, i) => ({ x: i, y }));
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer>
        <LineChart data={rows}>
          <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}