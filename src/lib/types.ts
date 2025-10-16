export type KPI = {
  sessions: number;
  cvRate: number;
  bounceRate: number;
  avgTime: string; // "m:ss"
};

export type RadarRow = { subject: string; score: number };

export type ScanResponse = {
  source: "ai" | "mock" | "api";
  kpi: KPI;
  radar: RadarRow[];
  notes?: string[];
};

export type ScanRecord = {
  url: string;
  kpi: KPI;
  radar: RadarRow[];
  ts: string;         // ISO
  version: string;    // e.g. "dmcc-1"
};