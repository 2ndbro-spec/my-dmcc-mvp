import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();

async function ensure(file: string, fallback: any) {
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
  }
}

export async function readJSON<T>(rel: string, fallback: T): Promise<T> {
  const file = path.join(root, rel);
  await ensure(file, fallback);
  const buf = await fs.readFile(file, "utf8");
  try {
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(rel: string, data: T) {
  const file = path.join(root, rel);
  await ensure(file, data);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}