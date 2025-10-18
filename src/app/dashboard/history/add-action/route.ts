import path from "node:path";
import fs from "node:fs";
import { DATA_DIR, ensureDirs } from "@/lib/fsutil";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const logId = String(form.get("logId") || "");
    const title = String(form.get("title") || "");
    const notes = String(form.get("notes") || "");

    if (!logId || !title) return NextResponse.json({ ok:false, error:"missing" }, { status: 400 });

    ensureDirs();
    const p = path.join(DATA_DIR, "actions.jsonl");
    const line = JSON.stringify({
      ts: Date.now(), logTs: isNaN(Number(logId)) ? logId : Number(logId),
      type: "done", title, notes
    }) + "\n";
    fs.appendFileSync(p, line, "utf-8");

    return NextResponse.redirect(`/dashboard/history/${encodeURIComponent(logId)}`, { status: 303 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status: 500 });
  }
}