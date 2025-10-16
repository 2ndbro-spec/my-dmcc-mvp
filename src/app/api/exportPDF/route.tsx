// src/app/api/exportPDF/route.tsx
import { NextRequest, NextResponse } from "next/server";
import { fetchScan } from "@/lib/scanClient";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json().catch(() => ({ url: "" }));
    const targetUrl = url || "https://puenteoffice.wordpress.com/";
    const data = await fetchScan(targetUrl);

    // react-pdf は動的 import
    const { Document, Page, Text, View, StyleSheet, pdf, Font } = await import("@react-pdf/renderer");

    // ----- フォント登録（TTF があれば NotoSansJP、無ければ Helvetica） -----
    const pub = (...segs: string[]) => path.join(process.cwd(), "public", ...segs);
    const jpRegular = pub("fonts", "NotoSansJP-Regular.ttf");
    const jpBold    = pub("fonts", "NotoSansJP-Bold.ttf");

    let fontFamily = "Helvetica"; // フォールバック
    try {
      if (fs.existsSync(jpRegular) && fs.existsSync(jpBold)) {
        Font.register({
          family: "NotoSansJP",
          fonts: [
            { src: jpRegular, fontWeight: "normal" },
            { src: jpBold,    fontWeight: "bold"   },
          ],
        });
        fontFamily = "NotoSansJP";
      }
    } catch (e) {
      console.warn("[exportPDF] font register skipped:", e);
    }
    // ---------------------------------------------------------------------

    const styles = StyleSheet.create({
      t: { fontFamily },
      page: { padding: 32 },
      h1:   { fontSize: 20, marginBottom: 8, fontWeight: "bold" },
      sub:  { fontSize: 10, color: "#666", marginBottom: 16 },
      section: { marginTop: 16 },
      box: {
        borderWidth: 1, borderStyle: "solid", borderColor: "#ddd",
        borderRadius: 6, padding: 12, marginBottom: 8,
      },
      row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
      kpiLabel: { fontSize: 12, color: "#666" },
      kpiValue: { fontSize: 14, fontWeight: "bold" },
      footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 10, color: "#888" },
    });

    const Doc = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={[styles.t, styles.h1]}>DMCC 診断レポート</Text>
          <Text style={[styles.t, styles.sub]}>
            対象: {targetUrl} ／ 生成: {new Date().toLocaleString("ja-JP")} ／ データ: {data.source ?? "-"}
          </Text>

          <View style={styles.section}>
            <Text style={[ styles.t, { fontSize: 14, marginBottom: 8 }]}>主要KPI</Text>
            <View style={styles.box}>
              <View style={styles.row}><Text style={[styles.t, styles.kpiLabel]}>セッション数</Text><Text style={[styles.t, styles.kpiValue]}>{data.kpi.sessions.toLocaleString()}</Text></View>
              <View style={styles.row}><Text style={[styles.t, styles.kpiLabel]}>CV率</Text><Text style={[styles.t, styles.kpiValue]}>{data.kpi.cvRate}%</Text></View>
              <View style={styles.row}><Text style={[styles.t, styles.kpiLabel]}>直帰率</Text><Text style={[styles.t, styles.kpiValue]}>{data.kpi.bounceRate}%</Text></View>
              <View style={styles.row}><Text style={[styles.t, styles.kpiLabel]}>平均滞在時間</Text><Text style={[styles.t, styles.kpiValue]}>{data.kpi.avgTime}</Text></View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[ styles.t, { fontSize: 14, marginBottom: 8 }]}>総合スコア（レーダー項目）</Text>
            <View style={styles.box}>
              {data.radar.map((r, i) => (
                <View key={i} style={styles.row}>
                  <Text style={[styles.t, styles.kpiLabel]}>{r.subject}</Text>
                  <Text style={[styles.t, styles.kpiValue]}>{r.score}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.t, styles.footer]}>© {new Date().getFullYear()} SOLVO / DMCC. Confidential.</Text>
        </Page>
      </Document>
    );

    const buffer = await pdf(Doc()).toBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="DMCC_Report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[exportPDF] error:", e);
    return NextResponse.json({ error: e?.message ?? "failed to export pdf" }, { status: 500 });
  }
}