// src/app/dashboard/history/page.tsx
import fs from "node:fs";
import path from "node:path";
import cronParser from "cron-parser";
import { getCronExpr, getCurrentSchedule } from "@/lib/dmccScheduler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Line = { t?: number; type?: string; [k: string]: any };

function readHistory(max = 200): Line[] {
  const p = path.join(process.cwd(), "var", "data", "scan-history.jsonl");
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf-8").trim().split("\n").slice(-max);
  return lines
    .map(l => { try { return JSON.parse(l) as Line; } catch { return {}; } })
    .filter(Boolean)
    .reverse(); // 新しい順
}

function fmt(ts?: number) {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n:number)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default async function Page() {
  const hist = readHistory(300);
  const last = hist.find(h => h.type?.startsWith("scan:"));
  const sched = getCurrentSchedule();
  const expr = getCronExpr();

  let nextRun = "-";
  try {
    const it = cronParser.parseExpression(expr, { tz: "Asia/Tokyo" });
    nextRun = it.next().toString();
  } catch {}

  const stat = {
    total: hist.filter(h => h.type?.startsWith("scan:")).length,
    ok:    hist.filter(h => h.type === "scan:ok").length,
    err:   hist.filter(h => h.type === "scan:err").length,
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">DMCC｜スキャン履歴</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl shadow bg-white">
          <div className="text-sm text-gray-500">次回実行予定</div>
          <div className="font-semibold">{nextRun}</div>
          <div className="text-xs text-gray-500 mt-1">Cron: <code>{expr}</code></div>
        </div>
        <div className="p-4 rounded-2xl shadow bg-white">
          <div className="text-sm text-gray-500">最新実行</div>
          <div className="font-semibold">{fmt(last?.t)}</div>
          <div className="text-xs text-gray-500 mt-1">{last?.type || "-"}</div>
        </div>
        <div className="p-4 rounded-2xl shadow bg-white">
          <div className="text-sm text-gray-500">統計</div>
          <div className="font-semibold">OK {stat.ok} / ERR {stat.err} / ALL {stat.total}</div>
        </div>
      </div>

      <div className="rounded-2xl shadow overflow-hidden bg-white">
        <div className="px-4 py-3 border-b font-semibold">直近ログ</div>
        <div className="divide-y">
          {hist.slice(0, 100).map((h, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-4 text-sm">
              <span className={`px-2 py-1 rounded ${h.type === "scan:ok" ? "bg-green-100 text-green-700" : h.type === "scan:err" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                {h.type || "-"}
              </span>
              <span className="text-gray-500 w-56">{fmt(h.t)}</span>
              <pre className="flex-1 whitespace-pre-wrap break-all">{JSON.stringify(h.meta ?? h.err ?? h, null, 2)}</pre>
            </div>
          ))}
          {!hist.length && <div className="px-4 py-6 text-gray-500">履歴がまだありません。</div>}
        </div>
      </div>
    </div>
  );
}