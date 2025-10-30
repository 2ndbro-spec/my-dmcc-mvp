"use client";
import useSWR, { mutate } from "swr";
import { signIn } from "next-auth/react";
import { GoogleConnectCard } from "@/components/settings/GoogleConnectCard";
import GA4Widget from "@/components/GA4Widget";  // ← 追加

const fetcher = async (url: string) => {
  if (!url) throw new Error("URL is undefined!");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed: " + res.status);
  return res.json();
};

// タブの骨組み（既存）
function Tabs({ tab, setTab }: { tab: string; setTab: (v: string) => void }) {
  const items = ["Site", "Schedule", "Email", "AI"];
  return (
    <div className="flex gap-2 border-b">
      {items.map(x => (
        <button
          key={x}
          onClick={() => setTab(x)}
          className={`px-3 py-2 ${tab === x ? "border-b-2 border-blue-600 font-semibold" : ""}`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { data } = useSWR("/api/settings/get", fetcher);

  const connected = Boolean(data?.google?.connected);
  const email = data?.google?.email ?? "";

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Google連携カード */}
      <GoogleConnectCard
        title="Google連携"
        provider="analytics"
        connected={connected}
        accountEmail={email}
        onConnect={() => {
          signIn("google");
        }}
        onDisconnect={async () => {
          await fetch("/api/auth/google/disconnect", { method: "POST" });
          mutate("/api/settings/get");
        }}
      />

      {/* 通知メールなどの設定フォーム */}
      <form action="/api/settings/save" method="post" className="grid gap-3 max-w-xl">
        <fieldset className="border rounded p-3">
          <legend className="px-1 text-sm">通知メール</legend>
          <input
            name="email.to"
            defaultValue={data?.email?.to || ""}
            placeholder="to"
            className="w-full border rounded px-3 py-2 mb-2"
          />
          <input
            name="email.from"
            defaultValue={data?.email?.from || ""}
            placeholder="from"
            className="w-full border rounded px-3 py-2 mb-2"
          />
          <input
            name="email.fromName"
            defaultValue={data?.email?.fromName || ""}
            placeholder="fromName"
            className="w-full border rounded px-3 py-2"
          />
        </fieldset>

        <fieldset className="border rounded p-3">
          <legend className="px-1 text-sm">ターゲット</legend>
          <textarea
            name="targets"
            defaultValue={(data?.targets || []).join("\n")}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder={"https://example.com\nhttps://foo.com"}
          />
        </fieldset>

        <fieldset className="border rounded p-3">
          <legend className="px-1 text-sm">スケジュール</legend>
          <select
            name="schedule.schedule"
            defaultValue={data?.schedule?.schedule || "weekly"}
            className="border rounded px-2 py-1"
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
          <input
            name="schedule.hour"
            defaultValue={data?.schedule?.hour ?? 3}
            type="number"
            min={0}
            max={23}
            className="ml-2 w-20 border rounded px-2 py-1"
          />
          時
          <input
