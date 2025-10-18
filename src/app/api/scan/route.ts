import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { ScanResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ※ GET は削除。/api/scan は「単発スキャンの POST 専用」にする。
//   triggerScan とは相互参照させない（循環で初期化失敗しやすい）。

export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({ url: "" }));
    const target = (url || "").trim();
    if (!target) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    // 1) HTML取得
    const res = await fetch(target, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DMCC/1.0; +https://example.com/bot)",
        "accept-language": "ja,en;q=0.8",
      },
      cache: "no-store",
    }).catch(() => null);

    let html = "";
    if (res && res.ok) {
      const raw = await res.text();
      html = raw.slice(0, 120_000);
    }

    // 2) メタ抽出
    const pick = (re: RegExp) => html.match(re)?.[1]?.trim() || "";
    const title =
      pick(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
      pick(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const desc =
      pick(/name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      pick(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const textSample = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 4000);

    // 3) LLM
    const system = `
あなたはSEO/MEOの実務コンサルタント。対象URLの外部情報（HTML/メタ）から、
「経営層に伝わる要約」と「すぐ動ける改善指針」を両立させた診断をJSONで返す。
JSON以外の文章は一切出力しない。

制約:
- 数字は根拠を曖昧にしない。推定は推定であると明記。
- スコアは0-100で丸める。
- 出力は下のschemaに厳密に従う。余計なキーは入れない。

schema:
{
  "kpi": {
    "sessions": number,
    "cvRate": number,
    "bounceRate": number,
    "avgTime": string
  },
  "radar": [
    {"subject":"SEO","score":number},
    {"subject":"コンテンツ","score":number},
    {"subject":"技術/速度","score":number},
    {"subject":"E-E-A-T","score":number},
    {"subject":"MEO(GBP)","score":number}
  ],
  "notes": string[]
}
`;

    const user = {
      role: "user" as const,
      content: [
        {
          type: "text",
          text: `URL: ${target}
TITLE: ${title || "-"}
DESC: ${desc || "-"}
H1: ${h1 || "-"}
本文サンプル:
${textSample || "(取得できず)"}`,
        },
      ],
    };

    const completion = await openai.chat.completions.create({
      model: process.env.DMCC_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, user],
    });

    const rawText = completion.choices[0]?.message?.content ?? "{}";
    let payload: any = {};
    try { payload = JSON.parse(rawText); } catch {}

    const safeNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const safeStr = (v: any, d = "") => (typeof v === "string" ? v : d);

    const out: ScanResponse = {
      source: "ai",
      kpi: {
        sessions: safeNum(payload?.kpi?.sessions, 0),
        cvRate: safeNum(payload?.kpi?.cvRate, 0),
        bounceRate: safeNum(payload?.kpi?.bounceRate, 0),
        avgTime: safeStr(payload?.kpi?.avgTime, "0:00"),
      },
      radar: Array.isArray(payload?.radar)
        ? payload.radar
            .map((r: any) => ({
              subject: safeStr(r?.subject, ""),
              score: Math.max(0, Math.min(100, safeNum(r?.score, 0))),
            }))
            .filter((r: any) => r.subject)
        : [],
      notes: Array.isArray(payload?.notes)
        ? payload.notes.map((s: any) => safeStr(s, "")).filter(Boolean)
        : [],
    };

    if (!out.radar.length) {
      out.radar = [
        { subject: "SEO", score: 60 },
        { subject: "コンテンツ", score: 55 },
        { subject: "技術/速度", score: 50 },
        { subject: "E-E-A-T", score: 45 },
        { subject: "MEO(GBP)", score: 40 },
      ];
    }

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("[scan] error:", e?.stack || e?.message || String(e));
    const fallback: ScanResponse = {
      source: "mock",
      kpi: { sessions: 0, cvRate: 0, bounceRate: 0, avgTime: "0:00" },
      radar: [
        { subject: "SEO", score: 50 },
        { subject: "コンテンツ", score: 50 },
        { subject: "技術/速度", score: 50 },
        { subject: "E-E-A-T", score: 50 },
        { subject: "MEO(GBP)", score: 50 },
      ],
      notes: ["AI分析フォールバックで出力しました。"],
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}