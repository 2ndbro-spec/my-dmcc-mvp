import { NextResponse } from "next/server";
import { getGoogleConfig } from "@/lib/google";
export async function GET(){
  const cfg = getGoogleConfig();
  const connected = Boolean(cfg.tokens?.refresh_token);
  return NextResponse.json({ connected, ga: cfg.ga||{}, gsc: cfg.gsc||{} });
}