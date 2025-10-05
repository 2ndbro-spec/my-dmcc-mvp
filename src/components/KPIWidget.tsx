"use client";
import React from "react";
export default function KPIWidget({ label, value, target }:
  { label: string; value: number; target?: number }) {
  const percent = target ? Math.min(100, (value/target)*100) : 0;
  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {typeof target === "number" && (
        <div className="mt-2 w-full bg-gray-200 h-2 rounded" role="progressbar"
             aria-valuenow={value} aria-valuemin={0} aria-valuemax={target}>
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
