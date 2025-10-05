const CRAWLER_BASE = "/crawler"; // rewrites で 8090 に飛ぶ

export type CrawlResult = {
  url: string;
  title?: string;
  description?: string;
  h1?: string;
  score?: number;
  pagesCrawled?: number;
  analyzedAt?: string;
};

type StartResponse = { jobId: string };
type StatusResponse = {
  jobId: string;
  status: "queued" | "running" | "done" | "cancelled";
  done: number;
  queued: number;
  pages: number;
  errors: number;
  startedAt?: string;
  finishedAt?: string | null;
};

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${CRAWLER_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${CRAWLER_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/** クローラ開始 → 完了までポーリング → 結果取得 */
export async function runCrawl(url: string, depth = 1, maxPages = 30, pollMs = 1500, timeoutMs = 60_000): Promise<CrawlResult> {
  if (!/^https?:\/\//.test(url)) throw new Error("URL は http(s) で始めてください");
  // 1) start
  const { jobId } = await postJSON<StartResponse>("/crawl/start", { url, depth, maxPages });

  // 2) poll
  const t0 = Date.now();
  while (true) {
    const s = await getJSON<StatusResponse>(`/crawl/status/${jobId}`);
    if (s.status === "done") break;
    if (Date.now() - t0 > timeoutMs) throw new Error("crawler timeout");
    await new Promise((r) => setTimeout(r, pollMs));
  }

  // 3) result
  return getJSON<CrawlResult>(`/crawl/result/${jobId}`);
}