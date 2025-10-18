import path from "node:path";
import { CONF_DIR, readJSON } from "@/lib/fsutil";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const p = path.join(CONF_DIR, "user.json");
  const cfg = readJSON<any>(p, {});
  return NextResponse.json(cfg);
}