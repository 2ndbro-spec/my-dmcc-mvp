// src/app/api/ga/summary/route.ts
import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getGoogleConfig, getOAuth } from "@/lib/google";

export async function GET(){
  const { ga } = getGoogleConfig();
  if (!ga?.propertyId) return NextResponse.json({ok:false, error:"GA property not set"}, {status:400});

  // auth: OAuth のアクセストークンを headers で使う
  const oauth = getOAuth();
  const token = (await oauth.getAccessToken()).token!;
  const client = new BetaAnalyticsDataClient({
    headers: { Authorization: `Bearer ${token}` }
  } as any);

  const [res] = await client.runReport({
    property: `properties/${ga.propertyId}`,
    dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
    metrics: [{name:"sessions"}, {name:"totalUsers"}, {name:"engagementRate"}],
    dimensions: [{name:"date"}]
  });

  // 返却整形
  const rows = res.rows?.map(r=>({
    date: r.dimensionValues?.[0]?.value,
    sessions: Number(r.metricValues?.[0]?.value||0),
    users: Number(r.metricValues?.[1]?.value||0),
    engagementRate: Number(r.metricValues?.[2]?.value||0)
  })) ?? [];

  const total = rows.reduce((a,b)=>({
    sessions:a.sessions+b.sessions, users:a.users+b.users,
    engagementRate: (a.engagementRate + b.engagementRate)
  }), {sessions:0,users:0,engagementRate:0});
  return NextResponse.json({ rows, total });
}