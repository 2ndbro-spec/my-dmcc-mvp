"use client";
import { useState } from "react";

type Period = "daily" | "weekly" | "monthly";

export default function PdfExportButton({
  period,
  url,
}: {
  period: Period;
  url: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!url) {
      alert("URLを入力してくれ。");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/report/${period}?url=${encodeURIComponent(url)}`,
        { method: "GET" }
      );
      if (!res.ok) throw new Error("PDF生成に失敗");

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `DMCC_${period}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
      alert("PDF出力に失敗。ログを見よう。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-2 rounded-md bg-black text-white disabled:opacity-60"
      title="現在のレポートをPDF出力"
    >
      {loading ? "生成中…" : "PDF出力"}
    </button>
  );
}