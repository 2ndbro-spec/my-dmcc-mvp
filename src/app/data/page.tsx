"use client";
import CsvUploader from "@/components/CsvUploader";

export default function DataPage() {
  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">データ取り込み</h1>
      <p className="text-gray-600">
        CSVをプレビューして列をマッピングしてから取り込みます。
      </p>
      <CsvUploader />
    </main>
  );
}
