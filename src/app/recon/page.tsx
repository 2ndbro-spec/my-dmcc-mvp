"use client";

import { useState } from "react";
import { runCrawl, type CrawlResult } from "@/lib/crawler";

export default function ReconPage() {
  const [url, setUrl] = useState("https://dennoworks.com");
  const [res, setRes] = useState<CrawlResult | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string>("");

  const onRun = async () => {
    setErr("");
    setRes(null);
    setRunning(true);
    try {
      const r = await runCrawl(url, 1, 30);
      setRes(r);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Recon（URLクロール：分離クローラ）</h1>

      <div className="flex gap-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/"
        />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={onRun}
          disabled={running}
        >
          {running ? "実行中…" : "今すぐ実行"}
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      {res && (
        <section className="border rounded p-4 space-y-2">
          <p className="text-xs text-gray-500">取得時刻：{res.analyzedAt || "-"}</p>
          <p>
            <b>URL：</b>{" "}
            <a href={res.url} target="_blank" className="text-blue-600 underline">
              {res.url}
            </a>
          </p>
          <p><b>Title：</b> {res.title || "-"}</p>
          <p><b>Description：</b> {res.description || "-"}</p>
          <p><b>H1：</b> {res.h1 || "-"}</p>
          <p><b>Score：</b> {res.score ?? "-"}</p>
          <p className="text-sm text-gray-500"><b>Pages crawled：</b> {res.pagesCrawled ?? "-"}</p>
        </section>
      )}
    </main>
  );
}