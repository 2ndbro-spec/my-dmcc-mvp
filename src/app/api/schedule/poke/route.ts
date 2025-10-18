// src/app/api/schedule/poke/route.ts
import { NextResponse } from "next/server";
import * as scheduler from "@/lib/dmccScheduler";
import cronParser from "cron-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const conf = scheduler.getCurrentSchedule();
  const expr = scheduler.getCronExpr();
  scheduler.ensureScheduler();

  let nextRun: string | null = null;
  try {
    const it = cronParser.parseExpression(expr, { tz: "Asia/Tokyo" });
    nextRun = it.next().toString();
  } catch (e) {
    console.error("[poke] nextRun parse failed", e);
  }

  return NextResponse.json({ ok: true, conf, expr, nextRun });
}