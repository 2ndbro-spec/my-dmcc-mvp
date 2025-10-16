import "server-only";
import { ScanResponse } from "./types";

const BASE = process.env.SCAN_BASE_URL;
const KEY  = process.env.SCAN_API_KEY;

export async function fetchScan(url: string): Promise<ScanResponse> {
  // 未設定時はモックで返す
  if (!BASE || !KEY) {
    return {
      kpi: { sessions: 2340, cvRate: 3.4, bounceRate: 47, avgTime: "2:13" },
      radar: [
        { subject: "SEO", score: 90 },
        { subject: "SNS", score: 75 },
        { subject: "広告運用", score: 65 },
        { subject: "サイト速度", score: 80 },
        { subject: "デザイン", score: 70 },
        { subject: "UX", score: 85 },
      ],
      source: "mock",
    };
  }

  const endpoint = `${BASE.replace(/\/$/,"")}/scan`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${KEY}`,
    },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      kpi: { sessions: 2340, cvRate: 3.4, bounceRate: 47, avgTime: "2:13" },
      radar: [
        { subject: "SEO", score: 90 },
        { subject: "SNS", score: 75 },
        { subject: "広告運用", score: 65 },
        { subject: "サイト速度", score: 80 },
        { subject: "デザイン", score: 70 },
        { subject: "UX", score: 85 },
      ],
      source: "mock(error)",
    };
  }

  const data = await res.json();
  return {
    kpi: {
      sessions: Number(data?.kpi?.sessions ?? 0),
      cvRate: Number(data?.kpi?.cvRate ?? 0),
      bounceRate: Number(data?.kpi?.bounceRate ?? 0),
      avgTime: String(data?.kpi?.avgTime ?? "0:00"),
    },
    radar: Array.isArray(data?.radar)
      ? data.radar.map((r: any) => ({ subject: String(r.subject), score: Number(r.score) }))
      : [],
    source: "live",
  };
}