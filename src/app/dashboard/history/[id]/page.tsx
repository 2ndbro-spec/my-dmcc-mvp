import path from "node:path";
import { DATA_DIR, readJSONL } from "@/lib/fsutil";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HistoryDetail({ params }: { params: { id: string }}) {
  const p = path.join(DATA_DIR, "scan-history.jsonl");
  const rows = readJSONL<any>(p, 1000); // 量あるなら絞ってOK
  const hit = rows.find(r => String(r.t ?? r.ts ?? "") === decodeURIComponent(params.id));
  if (!hit) return <div className="p-6">データが見つかりません。</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">レポート詳細</h1>
      <div className="rounded border p-4">
        <div className="text-sm text-muted-foreground">URL</div>
        <div className="font-medium">{hit.url}</div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Kpi label="Sessions" v={hit.kpi?.sessions} />
        <Kpi label="CVR (%)" v={hit.kpi?.cvRate} />
        <Kpi label="Bounce (%)" v={hit.kpi?.bounceRate} />
        <Kpi label="Avg Time" v={hit.kpi?.avgTime} />
      </div>

      <section>
        <h2 className="font-medium mb-2">レーダー（数値一覧）</h2>
        <ul className="list-disc pl-5 text-sm">
          {(hit.radar||[]).map((r:any,i:number)=>(<li key={i}>{r.subject}: {r.score}</li>))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">提案</h2>
        <ul className="list-disc pl-5 text-sm">
          {(hit.notes||[]).map((n:string,i:number)=>(<li key={i}>{n}</li>))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">実施メモを追加</h2>
        <form method="post" action="/api/history/add-action" className="space-y-2">
          <input type="hidden" name="logId" value={String(hit.t ?? hit.ts ?? "")} />
          <input name="title" placeholder="何をした？（例：タイトル最適化）"
                 className="w-full border rounded px-3 py-2" />
          <textarea name="notes" placeholder="詳細メモ" rows={4}
                    className="w-full border rounded px-3 py-2" />
          <button className="px-4 py-2 rounded bg-blue-600 text-white">保存</button>
        </form>
      </section>
    </div>
  );
}

function Kpi({label,v}:{label:string;v:any}) {
  return (
    <div className="rounded border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{String(v ?? "-")}</div>
    </div>
  );
}