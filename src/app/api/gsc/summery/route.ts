// src/app/api/gsc/summary/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleConfig, getOAuth } from "@/lib/google";

export async function GET(){
  const { gsc } = getGoogleConfig();
  if (!gsc?.siteUrl) return NextResponse.json({ok:false, error:"GSC site not set"}, {status:400});

  const auth = getOAuth();
  const webmasters = google.webmasters({version:"v3", auth});
  const end = new Date(); end.setDate(end.getDate()-1);
  const start = new Date(); start.setDate(start.getDate()-29);

  const q = {
    startDate: start.toISOString().slice(0,10),
    endDate: end.toISOString().slice(0,10),
    dimensions: ["date"],
    rowLimit: 1000
  };

  const res = await webmasters.searchanalytics.query({ siteUrl: gsc.siteUrl, requestBody: q });
  const rows = (res.data.rows||[]).map(r=>({
    date: r.keys?.[0], clicks: r.clicks||0, impressions:r.impressions||0,
    ctr: r.ctr||0, position:r.position||0
  }));

  const total = rows.reduce((a,b)=>({
    clicks:a.clicks+b.clicks, impressions:a.impressions+b.impressions,
    ctr: a.ctr + b.ctr, position: a.position + b.position
  }), {clicks:0, impressions:0, ctr:0, position:0});

  return NextResponse.json({ rows, total });
}