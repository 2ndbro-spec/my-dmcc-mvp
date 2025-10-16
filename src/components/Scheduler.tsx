"use client";
import { useEffect, useState } from "react";

type Sched = {
  id?: string;
  url: string;
  freq: "daily" | "weekly";
  dow?: number;           // 0〜6（日〜土）weeklyのとき必須
  at: string;             // "HH:MM"
  tz: string;             // 例: "Asia/Tokyo"
  enabled: boolean;
};

export function Scheduler({ targetUrl }: { targetUrl: string }) {
  const [sched, setSched] = useState<Sched>({
    url: targetUrl, freq: "daily", at: "09:00", tz: "Asia/Tokyo", enabled: true,
  });
  const [list, setList] = useState<Sched[]>([]);

  const reload = async () => {
    const r = await fetch("/api/schedule");
    if (r.ok) setList(await r.json());
  };
  useEffect(() => { reload(); }, []);
  useEffect(() => { setSched(s => ({ ...s, url: targetUrl })); }, [targetUrl]);

  const save = async () => {
    const r = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sched, url: targetUrl }),
    });
    if (r.ok) { alert("スケジュールを保存しました"); reload(); }
    else alert("保存に失敗しました");
  };

  const del = async (id?: string) => {
    if (!id) return;
    const r = await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    if (r.ok) reload();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={sched.freq}
        onChange={(e) => setSched(s => ({ ...s, freq: e.target.value as any }))}
        className="border rounded px-2 py-1"
        aria-label="頻度"
      >
        <option value="daily">毎日</option>
        <option value="weekly">毎週</option>
      </select>

      {sched.freq === "weekly" && (
        <select
          value={sched.dow ?? 1}
          onChange={(e) => setSched(s => ({ ...s, dow: Number(e.target.value) }))}
          className="border rounded px-2 py-1"
          aria-label="曜日"
        >
          <option value={0}>日</option><option value={1}>月</option><option value={2}>火</option>
          <option value={3}>水</option><option value={4}>木</option><option value={5}>金</option><option value={6}>土</option>
        </select>
      )}

      <input
        type="time"
        value={sched.at}
        onChange={(e) => setSched(s => ({ ...s, at: e.target.value }))}
        className="border rounded px-2 py-1"
        aria-label="実行時刻"
      />

      <select
        value={sched.tz}
        onChange={(e) => setSched(s => ({ ...s, tz: e.target.value }))}
        className="border rounded px-2 py-1"
        aria-label="タイムゾーン"
      >
        <option>Asia/Tokyo</option>
        <option>UTC</option>
      </select>

      <button onClick={save} className="border px-3 py-1 rounded">
        スケジュール保存
      </button>

      {/* 既存スケジュールの簡易一覧 */}
      <div className="ml-2 text-xs text-gray-500">
        {list.map(s => (
          <div key={s.id} className="flex items-center gap-1">
            <span>
              {s.freq}{s.freq === "weekly" ? ` (曜:${s.dow})` : ""} {s.at} ({s.tz})
            </span>
            <button className="underline" onClick={() => del(s.id)}>削除</button>
          </div>
        ))}
      </div>
    </div>
  );
}