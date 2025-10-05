"use client";
import React, { useRef, useState, DragEvent } from "react";

/** MVP用の超軽量CSVパーサ（先頭数行のプレビュー用途）
 *  ・UTF-8/カンマ区切り前提
 *  ・ダブルクォートの簡易対応
 *  ・本格運用はサーバ側でcsv-parse等を推奨
 */
function parseCsvPreview(text: string, maxRows = 10): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", inQuotes = false;
  const outRow = () => { rows.push(field.split("\u0000")); field = ""; };
  // ここでは一行ずつsplitしてから簡易split、クォート対応を入れる
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    let cur = "";
    const cells: string[] = [];
    inQuotes = false;
    for (i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
    if (rows.length >= maxRows + 1) break; // +1 はヘッダー行
  }
  return rows;
}

const FIELD_OPTIONS = [
  { key: "ignore", label: "無視する" },
  { key: "date", label: "date" },
  { key: "source", label: "source" },
  { key: "medium", label: "medium" },
  { key: "channel_group", label: "channel_group" },
  { key: "sessions", label: "sessions" },
  { key: "users", label: "users" },
  { key: "conversions", label: "conversions" },
  { key: "revenue", label: "revenue" },
] as const;

type MappingKey = (typeof FIELD_OPTIONS)[number]["key"];

function autoGuess(header: string): MappingKey {
  const h = header.toLowerCase().trim();
  if (/^date$|日付/.test(h)) return "date";
  if (/^source$/.test(h)) return "source";
  if (/^medium$/.test(h)) return "medium";
  if (/channel/.test(h)) return "channel_group";
  if (/^sessions?$|セッション/.test(h)) return "sessions";
  if (/^users?$|ユーザ/.test(h)) return "users";
  if (/^conv|^conversions?$|cv\b|成約|応募|問い合わせ/.test(h)) return "conversions";
  if (/revenue|売上|金額|amount/.test(h)) return "revenue";
  return "ignore";
}

export default function CsvUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<MappingKey[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const readPreview = async (f: File) => {
    const text = await f.text();
    const rows = parseCsvPreview(text, 10);
    if (!rows.length) {
      setMsg("CSVを読み取れませんでした");
      return;
    }
    const hdr = rows[0].map((h) => h?.trim() ?? "");
    const map = hdr.map((h) => autoGuess(h));
    setHeaders(hdr);
    setPreview(rows.slice(0, 11)); // ヘッダー＋10行
    setMapping(map);
    setMsg("");
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      await readPreview(f);
    }
  };

  const onChoose = async (f: File) => {
    setFile(f);
    await readPreview(f);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mapping", JSON.stringify({ headers, mapping })); // ← マッピングを一緒に送る
      const resp = await fetch("/api/ingest/csv", { method: "POST", body: form });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setMsg(`取り込み完了: dataset_id=${data.dataset_id ?? "unknown"}`);
    } catch (e: any) {
      console.error(e);
      setMsg("アップロード失敗。CSV形式やサイズを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        aria-label="CSVをドラッグ＆ドロップ、またはクリックで選択"
      >
        {file ? `選択中：${file.name}` : "CSVをドラッグ＆ドロップ／クリックで選択"}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChoose(f);
        }}
      />

      {/* プレビュー＆マッピング */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">プレビュー（先頭10行）</h3>

          {/* マッピング行（セレクト） */}
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {headers.map((h, idx) => (
                    <th key={idx} className="border px-2 py-1 text-left">
                      <div className="text-gray-600">{h || `(col${idx+1})`}</div>
                      <select
                        className="mt-1 border rounded px-1 py-0.5"
                        value={mapping[idx] ?? "ignore"}
                        onChange={(e) => {
                          const m = [...mapping];
                          m[idx] = e.target.value as MappingKey;
                          setMapping(m);
                        }}
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="border px-2 py-1 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={upload}
            disabled={loading}
          >
            {loading ? "取り込み中…" : "このマッピングで取り込む"}
          </button>
        </div>
      )}

      {msg && <div className="text-sm">{msg}</div>}

      <div className="text-xs text-gray-500">
        推奨ヘッダー例：
        <code className="ml-1">date, source, medium, channel_group, sessions, users, conversions, revenue</code>
      </div>
    </div>
  );
}
