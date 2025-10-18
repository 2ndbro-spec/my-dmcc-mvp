import path from "node:path";
import { CONF_DIR, readJSON, writeJSON } from "@/lib/fsutil";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const p = path.join(CONF_DIR, "user.json");
  const curr = readJSON<any>(p, {});

  // フラットなFormをオブジェクトに詰める簡易マージ
  const obj: any = structuredClone(curr);
  const set = (pathStr: string, val: any) => {
    const keys = pathStr.split(".");
    let t = obj;
    keys.slice(0,-1).forEach(k => (t[k] ??= {}), t = t[k]);
    t[keys[keys.length-1]] = val;
  };

  for (const [k, v] of form.entries()) {
    if (k === "targets") {
      const arr = String(v).split("\n").map(s=>s.trim()).filter(Boolean);
      set("targets", arr);
    } else if (k.startsWith("schedule.")) {
      const key = k.replace("schedule.","");
      const val = key === "schedule" ? String(v) : Number(v);
      obj.schedule ??= {};
      obj.schedule[key] = val;
    } else if (k.startsWith("email.")) {
      const key = k.replace("email.", "");
      obj.email ??= {};
      obj.email[key] = String(v);
    }
  }

  writeJSON(p, obj);
  return NextResponse.redirect("/settings", { status: 303 });
}