const API_BASE = "/api";
type KPI = { label: string; value: number; target?: number };
type Rec = { id: string; title: string; description?: string };
type Sample = { id: string; title: string; date: string; summary: string };

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const resp = await fetch(url, init);
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  return resp.json() as Promise<T>;
}

export async function getDashboard(): Promise<{
  kpis: KPI[]; recommendations: Rec[]; latestSamples: Sample[];
}> {
  return fetcher("/dashboard");
}
