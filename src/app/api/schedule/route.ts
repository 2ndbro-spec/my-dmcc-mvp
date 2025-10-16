import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Schedule = {
  id: string;           // uuid
  url: string;          // 対象URL
  freq: "daily" | "weekly";
  dow?: number;         // 0=Sun ... 6=Sat (weeklyのとき必須)
  at: string;           // "HH:MM" (24h)
  tz: string;           // e.g. "Asia/Tokyo"
  lastRun?: string;     // ISO
  enabled: boolean;
};

const FILE = "data/schedules.json";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET() {
  const list = await readJSON<Schedule[]>(FILE, []);
  return NextResponse.json(list, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, url, freq, dow, at, tz, enabled = true } = body || {};

  if (!url || !freq || !at || !tz) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (freq === "weekly" && (dow == null || dow < 0 || dow > 6)) {
    return NextResponse.json({ error: "invalid dow" }, { status: 400 });
  }

  const list = await readJSON<Schedule[]>(FILE, []);
  if (id) {
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], url, freq, dow, at, tz, enabled };
    } else {
      list.push({ id, url, freq, dow, at, tz, enabled });
    }
  } else {
    list.push({ id: uuid(), url, freq, dow, at, tz, enabled });
  }
  await writeJSON(FILE, list);
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const list = await readJSON<Schedule[]>(FILE, []);
  const next = list.filter(s => s.id !== id);
  await writeJSON(FILE, next);
  return NextResponse.json({ ok: true }, { status: 200 });
}