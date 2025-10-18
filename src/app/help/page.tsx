// src/app/help/page.tsx
export default function Help(){
  return (
    <div className="p-6 space-y-6">
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Quick Start</h2>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Settings でサイトURLと通知先を登録</li>
          <li>「Run scan now」を一度実行して動作確認</li>
          <li>ダッシュボードで結果を確認、Projects に落とし込む</li>
        </ol>
      </section>
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">FAQ</h2>
        <details className="border rounded p-3"><summary>メールが届かない</summary><div className="pt-2 text-sm">SMTP設定・SPF/DMARC を確認…</div></details>
        <details className="border rounded p-3 mt-2"><summary>スケジュールが動かない</summary><div className="pt-2 text-sm">/api/schedule/poke が 200 か確認…</div></details>
      </section>
    </div>
  );
}