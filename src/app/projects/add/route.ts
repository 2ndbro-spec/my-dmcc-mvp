import path from "node:path";
import { DATA_DIR, readJSON, writeJSON } from "@/lib/fsutil";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title")||"").trim();
  if (!title) return NextResponse.redirect("/projects", { status: 303 });

  const p = path.join(DATA_DIR, "projects.json");
  const store = readJSON<any>(p, { boards:{now:[],next:[],later:[]}, tasks:{} });
  const id = "t"+Date.now();
  store.tasks[id] = { id, title, status:"todo" };
  store.boards.now.unshift(id);
  writeJSON(p, store);

  return NextResponse.redirect("/projects", { status: 303 });
}