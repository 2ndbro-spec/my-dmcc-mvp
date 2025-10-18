import { NextResponse } from "next/server";
import { getOAuth } from "@/lib/google";

export async function GET() {
  const oauth = getOAuth();
  const scopes = (process.env.GOOGLE_SCOPES||"").split(" ");
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes
  });
  return NextResponse.redirect(url);
}