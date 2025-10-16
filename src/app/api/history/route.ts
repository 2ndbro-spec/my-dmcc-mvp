// src/app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KPI = { sessions: number; cvRate: number; bounceRate: number; avgTime: string };
type Radar = Array<{ subject: string; score: number }>;
export type ScanRecord = {
  url: string;
  ts: string;          // ISO8601
  kpi: KPI;
  radar: Radar;
  version?: string;
};

// 保存先（プロジェクト配下）
const DATA_DIR = path.join(process.cwd(), "var", "data");
const DATA_FILE = path.join(DATA_DIR, "scan-history.jsonl");

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, ""); }
}

async function readAll(): Promise<ScanRecord[]> {
  await ensureFile();
  const txt = await fs.readFile(DATA_FILE, "utf8");
  if (!txt.trim()) return [];
  const lines = txt.split("\n").filter(Boolean);
  const out: ScanRecord[] = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch { /* skip */ }
  }
  return out;
}

async function append(rec: ScanRecord) {
  await ensureFile();
  await fs.appendFile(DATA_FILE, JSON.stringify(rec) + "\n", "utf8");
}

// POST /api/history : 1件追記
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = normalizeUrl(String(body?.url ?? ""));
    if (!url) return NextResponse.json({ error: "invalid url" }, { status: 400 });

    const rec: ScanRecord = {
      url,
      ts: String(body?.ts ?? new Date().toISOString()),
      kpi: {
        sessions: Number(body?.kpi?.sessions ?? 0),
        cvRate: Number(body?.kpi?.cvRate ?? 0),
        bounceRate: Number(body?.kpi?.bounceRate ?? 0),
        avgTime: String(body?.kpi?.avgTime ?? "0:00"),
      },
      radar: Array.isArray(body?.radar)
        ? body.radar.map((r: any) => ({
            subject: String(r?.subject ?? ""),
            score: Number(r?.score ?? 0),
          }))
        : [],
      version: String(body?.version ?? "dmcc-1"),
    };

    await append(rec);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[history POST] error:", e);
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}

// GET /api/history?url=...&limit=20 : 指定URLの最新N件
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = normalizeUrl(String(searchParams.get("url") ?? ""));
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 20)));
    if (!url) return NextResponse.json([], { status: 200 });

    const all = await readAll();
    const rows = all
      .filter(r => normalizeUrl(r.url) === url)
      .sort((a, b) => b.ts.localeCompare(a.ts)) // 新しい順
      .slice(0, limit);

    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    console.error("[history GET] error:", e);
    return NextResponse.json([], { status: 200 });
  }
}