// src/lib/reportTrigger.ts
import fs from "node:fs";
import path from "node:path";

export type Period = "daily" | "weekly" | "monthly";

const VAR_DIR = path.join(process.cwd(), "var", "config");
const USER_CONF = path.join(VAR_DIR, "user.json");

function readJSON<T = any>(p: string, fb: T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return fb; }
}

function pickTargets(): string[] {
  const cfg = readJSON(USER_CONF, {} as any);
  const t = Array.isArray(cfg?.targets)
    ? cfg.targets.filter((u: any) => typeof u === "string" && /^https?:\/\//.test(u))
    : [];
  if (t.length) return t;
  if (cfg?.site?.url && typeof cfg.site.url === "string") return [cfg.site.url];
  return [];
}

async function postJSON<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${url} ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text as any; }
}

function safeClone<T>(v: T): T {
  try { return JSON.parse(JSON.stringify(v)); } catch { return v; }
}

export async function triggerScan(period: Period) {
  const startedAt = Date.now();
  const targets = pickTargets();
  if (!targets.length) {
    throw new Error('no targets: set var/config/user.json { "targets": ["https://..."] } or { "site": { "url": "https://..." } }');
  }

  const BASE =
    process.env.DMCC_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const results: Array<{ url: string; ok: boolean; data?: any; error?: string }> = [];

  for (const url of targets) {
    try {
      const data = await postJSON<any>(`${BASE}/api/scan`, { url });
      results.push({ url, ok: true, data: safeClone(data) });
    } catch (e: any) {
      results.push({ url, ok: false, error: String(e?.message || e) });
    }
  }

  const ok = results.filter(r => r.ok).length;
  const err = results.length - ok;

  return {
    period,
    startedAt,
    tookMs: Date.now() - startedAt,
    count: results.length,
    ok,
    err,
    results: safeClone(results),
  };
}