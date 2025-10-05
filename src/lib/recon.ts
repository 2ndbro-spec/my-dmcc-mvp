const BASE = "/crawler";

export type ReconResult = {
  url: string;
  title?: string;
  description?: string;
  h1?: string;
  score?: number;
  analyzedAt?: string;
  // pagesCrawled?: number;
};

type StartResp = { jobId: string };
type StatusResp = {
  jobId: string;
  status: "queued"|"running"|"done"|"cancelled";
  done: number;
  queued: number;
  pages: number;
  errors: number;
  startedAt?: string;
  finishedAt?: string;
};

export async function startCrawl(url: string, depth = 1, maxPages = 50): Promise<string> {
  const res = await fetch(`${BASE}/crawl/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, depth, maxPages }),
  });
  if (!res.ok) throw new Error(`start failed: HTTP ${res.status}`);
  const data = (await res.json()) as StartResp;
  return data.jobId;
}

export async function getStatus(jobId: string): Promise<StatusResp> {
  const res = await fetch(`${BASE}/crawl/status/${jobId}`);
  if (!res.ok) throw new Error(`status failed: HTTP ${res.status}`);
  return res.json();
}

export async function getResult(jobId: string): Promise<ReconResult> {
  const res = await fetch(`${BASE}/crawl/result/${jobId}`);
  if (res.status === 202) {
    const j = await res.json();
    throw new Error(j?.status || "not ready");
  }
  if (!res.ok) throw new Error(`result failed: HTTP ${res.status}`);
  return res.json();
}