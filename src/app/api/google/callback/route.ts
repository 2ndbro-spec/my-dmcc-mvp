import { NextRequest, NextResponse } from "next/server";
import { getOAuth, saveTokens } from "@/lib/google";

export async function GET(req:NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ok:false, error:"missing code"}, {status:400});
  const oauth = getOAuth();
  const { tokens } = await oauth.getToken(code);
  saveTokens(tokens);
  return NextResponse.redirect("/settings?connected=google");
}