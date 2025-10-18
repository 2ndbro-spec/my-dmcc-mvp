// src/app/api/gsc/sites/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth } from "@/lib/google";

export async function GET(){
  const auth = getOAuth();
  const webmasters = google.webmasters({version:"v3", auth});
  const res = await webmasters.sites.list({});
  const items = res.data.siteEntry ?? [];
  return NextResponse.json(items.map(s=>({siteUrl:s.siteUrl, permissionLevel:s.permissionLevel})));
}