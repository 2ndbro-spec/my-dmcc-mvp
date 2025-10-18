// src/app/api/schedule/run-now/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { triggerScan, type Period } from "@/lib/reportTrigger";
import { notifyScanFinished } from "@/lib/mailer";
import { getCurrentSchedule } from "@/lib/dmccScheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 履歴追記（scheduler と同形式）
const DATA_DIR = path.join(process.cwd(), "var", "data");
const HIST_PATH = path.join(DATA_DIR, "scan-history.jsonl");
function appendHistory(line: Record<string, unknown>) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(HIST_PATH, JSON.stringify(line) + "\n", "utf-8");
  } catch {}
}

// JSONにできない値（関数・Symbol 等）を落として安全化
function safeJson<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v)) as T;
  } catch {
    return v;
  }
}

export async function POST() {
  const period = (getCurrentSchedule().schedule || "daily") as Period;
  const start = Date.now();
  appendHistory({ t: start, type: "scan:start", reason: "manual", period });

  try {
    const res = await triggerScan(period);          // ← ここで失敗しやすい
    const safe = safeJson(res);                     // ← レスポンスを必ず直列化可能に

    appendHistory({
      t: Date.now(),
      type: "scan:ok",
      ms: Date.now() - start,
      meta: safe,
      period,
    });

    // メール送信は失敗しても API を落とさない
    try { await notifyScanFinished({ period, meta: safe }); }
    catch (mailErr: any) {
      console.error("[DMCC][run-now] notify error:", mailErr?.stack || mailErr?.message || mailErr);
    }

    return NextResponse.json({ ok: true, period, res: safe }, { status: 200 });

  } catch (e: any) {
    const msg = e?.stack || e?.message || String(e);
    console.error("[DMCC][run-now] error:", msg);

    appendHistory({
      t: Date.now(),
      type: "scan:err",
      ms: Date.now() - start,
      err: msg,
      period,
    });

    // 失敗でも通知（失敗しても API は返す）
    try { await notifyScanFinished({ period, meta: { error: msg } }); }
    catch (mailErr: any) {
      console.error("[DMCC][run-now] notify error(2):", mailErr?.stack || mailErr?.message || mailErr);
    }

    return NextResponse.json({ ok: false, period, error: msg }, { status: 500 });
  }
}