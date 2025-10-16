import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Schedule = {
  id: string; url: string; freq: "daily" | "weekly";
  dow?: number; at: string; tz: string; enabled: boolean; lastRun?: string;
};

const FILE = "data/schedules.json";

function nowInTZ(tz: string) {
  const d = new Date();
  // toLocaleStringで簡易TZ対応（正確な比較は±1分幅で）
  const parts = d.toLocaleString("ja-JP", { timeZone: tz, hour12: false });
  return new Date(parts);
}

function isDue(s: Schedule) {
  if (!s.enabled) return false;
  const n = nowInTZ(s.tz);
  const [HH, MM] = s.at.split(":").map(Number);
  const okTime = n.getHours() === HH && Math.abs(n.getMinutes() - MM) <= 1; // ±1分許容
  if (!okTime) return false;
  if (s.freq === "weekly") {
    // 0=Sun ... 6=Sat
    return n.getDay() === (s.dow ?? -1);
  }
  return true;
}

async function scanAndSave(base: string, url: string) {
  // 1) スキャン
  const scanRes = await fetch(`${base}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!scanRes.ok) throw new Error("scan failed");
  const data = await scanRes.json();

  // 2) 履歴保存
  const histRes = await fetch(`${base}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      kpi: data.kpi,
      radar: data.radar,
      ts: new Date().toISOString(),
      version: "dmcc-1",
    }),
  });
  if (!histRes.ok) throw new Error("history failed");
}

export async function GET() {
  try {
    const base = process.env.BASE_URL || "http://localhost:3000";
    const list = await readJSON<Schedule[]>(FILE, []);
    const due = list.filter(isDue);

    for (const s of due) {
      try {
        await scanAndSave(base, s.url);
        s.lastRun = new Date().toISOString();
      } catch (e) {
        console.error("[runScheduled] one failed:", s.url, e);
      }
    }
    if (due.length) {
      await writeJSON(FILE, list);
    }
    return NextResponse.json({ ok: true, ran: due.map(d => d.url) }, { status: 200 });
  } catch (e: any) {
    console.error("[runScheduled] error:", e?.message || e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}