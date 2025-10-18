// src/app/(marketing)/page.tsx
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">
        DMCC — デジタルマーケティング司令室
      </h1>
      <p className="text-gray-600 max-w-lg mb-8">
        SEO・MEO・SNS解析をひとつに。あなたのビジネスをデータで強化する。
      </p>
      <a
        href="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        無料で始める
      </a>
    </main>
  );
}