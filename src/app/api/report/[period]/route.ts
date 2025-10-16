// src/app/api/report/[period]/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export const runtime = "nodejs";

const VAR_DIR = path.join(process.cwd(), "var", "data");
const HIST = path.join(VAR_DIR, "scan-history.jsonl");

// ==== ユーティリティ ====
function startDate(period: string) {
  const d = new Date();
  if (period === "weekly") d.setDate(d.getDate() - 7);
  else if (period === "monthly") d.setMonth(d.getMonth() - 1);
  else d.setDate(d.getDate() - 0); // 今日も含める
  return d;
}

function normalizeUrl(raw: string) {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

async function readRows() {
  if (!fssync.existsSync(HIST)) return [];
  const txt = await fs.readFile(HIST, "utf8");
  if (!txt.trim()) return [];
  return txt
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ==== メイン ====
export async function GET(req: Request, ctx: { params: { period: "daily" | "weekly" | "monthly" } }) {
  try {
    const period = ctx.params.period;
    const { searchParams } = new URL(req.url);
    const urlParam = normalizeUrl(searchParams.get("url") ?? "");

    const all = await readRows();
    const chosenUrl = urlParam || (all.at(-1)?.url ? normalizeUrl(all.at(-1)!.url) : "");
    if (!chosenUrl) return NextResponse.json({ error: "no history data" }, { status: 404 });

    const from = startDate(period);
    const filtered = all
      .filter((r) => normalizeUrl(r.url) === chosenUrl)
      .filter((r) => new Date(r.ts) >= from)
      .sort((a, b) => a.ts.localeCompare(b.ts));

    const n = Math.max(1, filtered.length);
    const sum = (f: (x: any) => number) => filtered.reduce((a, b) => a + f(b), 0);
    const avgSession = Math.round(sum((r) => Number(r.kpi?.sessions ?? 0)) / n);
    const avgCv = (sum((r) => Number(r.kpi?.cvRate ?? 0)) / n).toFixed(1);
    const avgBounce = (sum((r) => Number(r.kpi?.bounceRate ?? 0)) / n).toFixed(1);
    const avgTime = filtered.at(-1)?.kpi?.avgTime ?? "0:00";

    // ==== PDF生成 ====
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const REG_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf");
    const BLD_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansJP-Bold.ttf");
    const regBytes = await fs.readFile(REG_PATH);
    const bldBytes = await fs.readFile(BLD_PATH);
    const fontReg = await pdf.embedFont(regBytes, { subset: false });
    const fontBold = await pdf.embedFont(bldBytes, { subset: false });
    const fontMono = await pdf.embedFont(StandardFonts.Courier);

    const pdfPage = pdf.addPage([595, 842]);
    const margin = 50;
    let cursorY = 800;

    const draw = (text: string, size = 12, bold = false) => {
      pdfPage.drawText(text, { x: margin, y: cursorY, size, font: bold ? fontBold : fontReg });
      cursorY -= size + 8;
    };
    const hr = () => {
      pdfPage.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: 595 - margin, y: cursorY },
        thickness: 0.6,
      });
      cursorY -= 12;
    };
    const wrap = (text: string, size = 12, max = 595 - margin * 2) => {
      const words = text.split(/(\s+)/);
      let line = "";
      for (const w of words) {
        const next = line + w;
        if (fontReg.widthOfTextAtSize(next, size) > max) {
          draw(line, size);
          line = w.trimStart();
        } else line = next;
      }
      if (line) draw(line, size);
    };

    // ==== 日付整形（半角固定） ====
    const fmtTs = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${y}/${m}/${day} ${hh}:${mm}:${ss}`;
    };

    // ==== ヘッダー ====
    draw(`DMCC ${period.toUpperCase()} Report`, 20, true);
    draw(`対象期間: ${from.toLocaleDateString("ja-JP")} 〜 ${new Date().toLocaleDateString("ja-JP")}`);
    draw(`対象URL: ${chosenUrl}`);
    hr();

    // ==== 本文 ====
    if (filtered.length === 0) {
      wrap("※ 指定期間の履歴がありません。ダッシュボードの「診断」を実行すると履歴が蓄積され、ここに要約が表示されます。");
      hr();
    } else {
      draw("サマリ", 14, true);
      draw(`平均セッション数: ${avgSession}`);
      draw(`平均CV率: ${avgCv}%`);
      draw(`平均直帰率: ${avgBounce}%`);
      draw(`平均滞在時間: ${avgTime}`);
      hr();
      draw("直近の履歴（最大5件）", 14, true);

      filtered.slice(-5).reverse().forEach((r: any) => {
        const row =
          `${fmtTs(new Date(r.ts))} | S:${String(r.kpi.sessions ?? 0).padStart(4)} ` +
          `CV:${(r.kpi.cvRate ?? 0).toFixed?.(1) ?? 0}% ` +
          `B:${(r.kpi.bounceRate ?? 0).toFixed?.(1) ?? 0}% ` +
          `T:${r.kpi.avgTime ?? "0:00"}`;
        pdfPage.drawText(row, { x: margin, y: cursorY, size: 12, font: fontMono });
        cursorY -= 20;
      });
      hr();
    }

    // ==== サーバサイドSVG生成 → sharpでPNG化してPDFに埋め込み（with debug） ====
    try {
      console.log("[chart] filtered.len =", filtered.length);
      type Pt = { ts: string; v: number };
      let pts: Pt[] = filtered.map((r: any) => ({
        ts: r.ts,
        v: Number(r?.kpi?.sessions ?? 0),
      }));

      // データが空ならプレースホルダ（配管テスト用）
      const isPlaceholder = pts.length === 0;
      if (isPlaceholder) {
        console.warn("[chart] no data -> use placeholder");
        const now = new Date();
        const ts = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
        pts = [{ ts: ts(6), v: 0 }, { ts: ts(5), v: 2 }, { ts: ts(4), v: 6 }, { ts: ts(3), v: 3 }, { ts: ts(2), v: 5 }, { ts: ts(1), v: 0 }];
      }

      const W = 860, H = 260, PAD = 40;
      const innerW = W - PAD * 2, innerH = H - PAD * 2;
      const maxV = Math.max(10, ...pts.map(p => p.v));
      const toXY = (i: number, v: number) => {
        const x = PAD + (i / Math.max(1, pts.length - 1)) * innerW;
        const y = PAD + innerH - (v / maxV) * innerH;
        return { x, y };
      };

      let d = "";
      pts.forEach((p, i) => {
        const { x, y } = toXY(i, p.v);
        d += (i === 0 ? `M${x} ${y}` : ` L${x} ${y}`);
      });

      const yTicks = [0, Math.round(maxV * 0.5), maxV];
      const xTicks = pts.map((p, i) => ({ i, label: (p.ts ?? "").slice(5, 10).replace(/T.*/, "") }));

      const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
        <g font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
        <line x1="${PAD}" y1="${H-PAD}" x2="${W-PAD}" y2="${H-PAD}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H-PAD}" stroke="#e5e7eb" stroke-width="1"/>
        ${yTicks.map(v => {
          const { y } = toXY(0, v);
          return `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>
                  <text x="${PAD-8}" y="${y+4}" font-size="10" fill="#64748b" text-anchor="end">${v}</text>`;
        }).join("")}
        ${xTicks.map(t => {
          const { x } = toXY(t.i, 0);
          return `<text x="${x}" y="${H-PAD+16}" font-size="10" fill="#64748b" text-anchor="middle">${t.label}</text>`;
        }).join("")}
        <path d="${d}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map((p, i) => {
          const { x, y } = toXY(i, p.v);
          return `<circle cx="${x}" cy="${y}" r="3" fill="#2563eb"/>`;
        }).join("")}
        ${isPlaceholder ? `<text x="${W-12}" y="${PAD+12}" text-anchor="end" font-size="10" fill="#94a3b8">No data (placeholder)</text>` : ""}
        </g>
        </svg>`;

      const sharp = (await import("sharp")).default;
      const pngBuffer = await sharp(Buffer.from(svg))
        .resize(W * 2, H * 2, { fit: "fill" }) // 2xでくっきり
        .png({ compressionLevel: 9 })
        .toBuffer();

      console.log("[chart] png bytes =", pngBuffer.length);

      // ★ 追加：デバッグ出力
      await fs.mkdir(VAR_DIR, { recursive: true });
      await fs.writeFile(path.join(VAR_DIR, `debug-chart-${period}.png`), pngBuffer);

      const img = await pdf.embedPng(pngBuffer);
      const maxW = 595 - margin * 2;
      const scale = Math.min(1, maxW / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      cursorY -= 8; // 少し空ける
      const y = Math.max(60, cursorY - h);
      pdfPage.drawImage(img, { x: margin, y, width: w, height: h });
      cursorY = y - 16;
    } catch (e) {
      console.error("[report] server-side chart render failed:", e);
      draw("※ グラフ画像の生成に失敗しました。", 11);
    }

    // ==== 保存 ====
    const bytes = await pdf.save();
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="DMCC_${period}_report.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("[report GET] error:", e);
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}