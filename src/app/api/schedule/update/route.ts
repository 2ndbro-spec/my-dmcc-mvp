import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  schedule: "daily" | "weekly" | "monthly";
  hour?: number;     // 0-23
  minute?: number;   // 0-59
  dow?: 0|1|2|3|4|5|6; // weekly
  dom?: number;      // monthly (1-31)
};

const VAR_DIR = path.join(process.cwd(), "var", "config");
const USER_CONF = path.join(VAR_DIR, "user.json");

function readJSON<T = any>(p: string, fb: T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return fb; }
}

function writeJSON(p: string, v: any) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2), "utf-8");
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;

    if (!["daily","weekly","monthly"].includes(String(b.schedule))) {
      return NextResponse.json({ ok:false, error:"invalid schedule" }, { status: 400 });
    }
    const hour   = Number.isFinite(b.hour)   ? Math.min(23, Math.max(0,  Number(b.hour)))   : 3;
    const minute = Number.isFinite(b.minute) ? Math.min(59, Math.max(0,  Number(b.minute))) : 0;
    const dow    = b.schedule === "weekly"  ? (typeof b.dow === "number" ? (b.dow as 0|1|2|3|4|5|6) : 1) : undefined;
    const dom    = b.schedule === "monthly" ? (typeof b.dom === "number" ? Math.min(31, Math.max(1, b.dom)) : 1) : undefined;

    const current = readJSON(USER_CONF, {});
    const next = {
      ...current,
      schedule: {
        schedule: b.schedule,
        hour, minute,
        ...(dow !== undefined ? { dow } : {}),
        ...(dom !== undefined ? { dom } : {}),
      }
    };
    writeJSON(USER_CONF, next);

    return NextResponse.json({ ok:true, saved: next.schedule });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status: 500 });
  }
}