import fs from "node:fs";
import path from "node:path";

export const VAR_DIR = path.join(process.cwd(), "var");
export const DATA_DIR = path.join(VAR_DIR, "data");
export const CONF_DIR = path.join(VAR_DIR, "config");

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(CONF_DIR, { recursive: true });
}

export function readJSON<T=any>(p: string, fb: T): T {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return fb; }
}
export function writeJSON(p: string, v: any) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2), "utf-8");
}

export function readJSONL<T=any>(p: string, limit = 200): T[] {
  try {
    const text = fs.readFileSync(p, "utf-8").trim();
    if (!text) return [];
    const lines = text.split("\n");
    const slice = lines.slice(Math.max(0, lines.length - limit));
    return slice.map(l => JSON.parse(l));
  } catch { return []; }
}