// src/app/api/ga/properties/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth } from "@/lib/google";

export async function GET() {
  const auth = getOAuth();
  const res = await google.analyticsadmin("v1beta").properties.list({
    auth, filter: "parent:accounts/-"
  } as any);
  const items = res.data.properties ?? [];
  return NextResponse.json(items.map(p=>({id:p.name?.split("/")[1], displayName:p.displayName})));
}