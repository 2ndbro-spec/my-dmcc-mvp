// src/app/mypage/page.tsx
"use client";
import useSWR from "swr";
const f=(u:string)=>fetch(u).then(r=>r.json());

export default function MyPage(){
  const { data: hist=[] } = useSWR<any[]>("/api/history?limit=10", f);
  const latest = hist[0] ?? {};
  const todo = deriveTodos(latest); // ここで簡易提案（下にダミー）

  return (
    <div className="p-6 space-y-6">
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Next actions</h2>
        <ul className="space-y-2">
          {todo.map((t,i)=><li key={i} className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600">{t.desc}</div>
            </div>
          </li>)}
        </ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Quick checks</h2>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          <li>Title: <span className="font-medium">{latest.meta?.title ?? "-"}</span></li>
          <li>Description: <span className="font-medium">{latest.meta?.desc ?? "-"}</span></li>
          <li>OGP: <span className="font-medium">{latest.meta?.ogp ? "OK" : "Missing"}</span></li>
          <li>Analytics: <span className="font-medium">{latest.meta?.ga ? "Detected" : "N/A"}</span></li>
        </ul>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Recent scan</h2>
        <div className="text-sm text-gray-600">Updated: {latest.ts ? new Date(latest.ts).toLocaleString("ja-JP"): "-"}</div>
        <div className="mt-2">Notes:</div>
        <ul className="list-disc ml-5">{(latest.notes??[]).slice(0,5).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
      </section>
    </div>
  );
}

function deriveTodos(latest:any){
  const out = [];
  const r = latest.radar ?? [];
  if((r.find((x:any)=>x.subject==="SEO")?.score ?? 0) < 60){
    out.push({title:"メタ要素の最適化", desc:"title/description/H1 を見直し、主要KWを先頭に寄せる"});
  }
  if((r.find((x:any)=>x.subject==="技術/速度")?.score ?? 0) < 60){
    out.push({title:"速度改善", desc:"画像の遅延読み込み、critical CSS、LCP改善"});
  }
  return out.length ? out : [{title:"初回セットアップ", desc:"まず設定ページでサイトURLや通知先を登録"}];
}