import path from "node:path";
import { CONF_DIR, readJSON } from "@/lib/fsutil";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const p = path.join(CONF_DIR, "user.json");
    console.log("📂 読みに行ってるファイルのパス:", p);  // ←これを追加
    const cfg = readJSON<any>(p, {});
    return NextResponse.json(cfg);
  } catch (err) {
    console.error("🔥 読み込み失敗:", err);  // ←これも追加
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

