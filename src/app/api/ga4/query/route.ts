import { NextResponse } from "next/server";
import { runReport } from "@/server/ga4Client";

export async function GET() {
  // 実弾時だけ使う。モック時は無視OK
  const accessToken = null;

  const data = await runReport(accessToken, {
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    dimensions: [{ name: "date" }],
  });

  return NextResponse.json(data);
}