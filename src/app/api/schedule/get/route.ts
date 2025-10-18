import { NextResponse } from "next/server";
import { getCurrentSchedule, getCronExpr } from "@/lib/dmccScheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const conf = getCurrentSchedule();
  const expr = getCronExpr();
  return NextResponse.json({ ok: true, conf, expr });
}