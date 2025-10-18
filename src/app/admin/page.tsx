// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ScoreCard from "@/components/dashboard/ScoreCard";

export default async function Admin() {
  const session = await getServerSession();
  const role = (session as any)?.role;

  if (role !== "denno-admin" && role !== "admin") redirect("/dashboard");

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-2xl font-semibold">電脳ワークス 管理ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard score={88.2} label="System Health" />
        <ScoreCard score={74.3} label="Job Success Rate" />
        <ScoreCard score={61.8} label="Sync Latency (ms)" />
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm mt-4">
        <h3 className="font-semibold mb-2">ジョブログ</h3>
        <ul className="text-sm text-gray-700">
          <li>✅ 08:31 GA4 Import success (32 records)</li>
          <li>⚠️ 07:45 Backlink crawl timeout (retrying...)</li>
          <li>✅ 07:00 PSI batch update completed</li>
        </ul>
      </div>
    </div>
  );
}