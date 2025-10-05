const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer();
const app = express();

/* ====== 基本ミドルウェア ====== */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

/* ====== 永続用フォルダ ====== */
const DATA_DIR = path.join(__dirname, "datasets");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ====== ダッシュボード状態 ====== */
const state = {
  totals: { sessions: 0, users: 0, conversions: 0, revenue: 0 },
  lastDatasetId: null,
};
const toNumber = (x) => {
  if (x == null) return 0;
  const n = Number(String(x).replace(/[,¥$]/g, ""));
  return isNaN(n) ? 0 : n;
};

/* ====== ダッシュボード ====== */
app.get("/dashboard", (_req, res) => {
  const hasData =
    state.totals.sessions + state.totals.users + state.totals.conversions + state.totals.revenue > 0;

  const kpis = hasData
    ? [
        { label: "問い合わせ", value: state.totals.conversions, target: 50 },
        { label: "応募", value: state.totals.conversions, target: 20 },
        { label: "売上(万)", value: Math.round(state.totals.revenue / 10000), target: 300 },
      ]
    : [
        { label: "問い合わせ", value: 31, target: 50 },
        { label: "応募", value: 12, target: 20 },
        { label: "売上(万)", value: 180, target: 300 },
      ];

  res.json({
    kpis,
    recommendations: [
      { id: "rec1", title: "トップにCTA追加", description: "予約導線を上部固定" },
      { id: "rec2", title: "SNSハッシュタグ最適化", description: "検索ボリューム重視" },
    ],
    latestSamples: [
      { id: "cs1", title: "ブログ：秋のキャンペーン告知", date: "2025-10-05", summary: "キャンペーン概要＋CTA" },
    ],
    meta: { lastDatasetId: state.lastDatasetId, totals: state.totals },
  });
});

/* ====== CSV ingest ====== */
function parseCsv(text){
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(l=>l.trim()!=="");
  if (!lines.length) return { headers:[], rows:[] };
  const split = (line)=>{
    const out=[]; let cur="", inQ=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch === '"'){ if (inQ && line[i+1] === '"'){ cur+='"'; i++; } else inQ=!inQ; }
      else if (ch === ',' && !inQ){ out.push(cur); cur=""; }
      else { cur+=ch; }
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map(h=>h.trim());
  const rows = lines.slice(1).map(split);
  return { headers, rows };
}

app.post("/ingest/csv", upload.single("file"), (req, res) => {
  try{
    if (!req.file || !req.file.buffer) return res.status(400).json({ error:"file is required" });
    const mapping = req.body?.mapping ? JSON.parse(req.body.mapping) : null;
    const text = req.file.buffer.toString("utf8");
    const { headers, rows } = parseCsv(text);
    if (!headers.length) return res.status(400).json({ error:"empty csv" });

    let meaningByIndex=[];
    if (mapping && Array.isArray(mapping.headers) && Array.isArray(mapping.mapping)) {
      meaningByIndex = mapping.headers.map((_,i)=>mapping.mapping[i]||"ignore");
    } else {
      meaningByIndex = headers.map(h=>{
        const hh=h.toLowerCase();
        if (hh==="date"||/日付/.test(hh)) return "date";
        if (hh==="source") return "source";
        if (hh==="medium") return "medium";
        if (/channel/.test(hh)) return "channel_group";
        if (/^sessions?$|セッション/.test(hh)) return "sessions";
        if (/^users?$|ユーザ/.test(hh)) return "users";
        if (/^conv|^conversions?$|cv\b|成約|応募|問い合わせ/.test(hh)) return "conversions";
        if (/revenue|売上|金額|amount/.test(hh)) return "revenue";
        return "ignore";
      });
    }

    let totals = { sessions:0, users:0, conversions:0, revenue:0 };
    for (const row of rows){
      row.forEach((val,idx)=>{
        const key = meaningByIndex[idx];
        if (!key || key==="ignore") return;
        if (key in totals) totals[key] += toNumber(val);
      });
    }

    const id = `ds_${Date.now()}`;
    fs.writeFileSync(path.join(DATA_DIR, `${id}.csv`), text, "utf8");
    state.totals = totals;
    state.lastDatasetId = id;

    console.log("📥 CSV ingest:", { id, filename:req.file.originalname, size:req.file.size, totals });
    res.json({ dataset_id:id, totals });
  }catch(e){
    console.error(e);
    res.status(500).json({ error:"ingest failed" });
  }
});

/* ====== Recon（description + 内部リンク + 簡易スコアを返す・descキー） ====== */
app.post("/recon", async (req, res) => {
  try{
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//.test(url)) {
      return res.status(400).json({ error:"valid url required" });
    }
    console.log("🕷 Recon start:", url);
    const origin = new URL(url).origin;

    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 12_000);

    const resp = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 DMCC-MVP",
        "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return res.status(400).json({ error:`HTTP ${resp.status}` });

    const html = await resp.text();

    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim()
      || html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim()
      || "";

    const h1 =
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,"")?.trim() || "";

    const linkHrefs = [];
    const reA = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = reA.exec(html)) && linkHrefs.length < 300) linkHrefs.push(m[1]);
    const links = [];
    for (const href of linkHrefs) {
      try {
        const u = new URL(href, url);
        if (u.origin === origin) { u.hash = ""; links.push(u.toString()); }
      } catch {}
      if (links.length >= 50) break;
    }
    const uniqueLinks = [...new Set(links)];

    let score = 0;
    if (title) score += 20;
    if (title && title.length >= 10 && title.length <= 60) score += 10;
    if (description) score += 20;
    if (description && description.length >= 50 && description.length <= 160) score += 10;
    if (h1) score += 10;
    const imgCount = (html.match(/<img [^>]*>/gi) || []).length;
    const imgWithAlt = (html.match(/<img [^>]*alt=["'][^"']+["']/gi) || []).length;
    if (imgCount > 0) {
      const ratio = imgWithAlt / imgCount;
      if (ratio >= 0.6) score += 10;
      else if (ratio >= 0.3) score += 5;
    }
    if (uniqueLinks.length >= 10) score += 10;

    const payload = {
      url,
      title,
      desc: description,   // ← フロントが読むキー
      h1,
      links: uniqueLinks,
      score,
      analyzedAt: new Date().toISOString(),
    };

    console.log("✅ Recon done:", { url, score, links: uniqueLinks.length });
    res.json(payload);
  }catch(e){
    console.error("❌ Recon failed:", e);
    res.status(500).json({ error:String(e) });
  }
});

/* ====== 起動 ====== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ API mock running on port ${PORT}`));
