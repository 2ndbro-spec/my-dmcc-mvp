"use client";

export default function AIInsightsCard({
  bullets = [],
}: {
  bullets?: string[];
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-2">🧠 AI診断コメント</h3>
      {bullets.length === 0 ? (
        <div className="text-sm text-gray-500">現在の診断コメントはありません。</div>
      ) : (
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}