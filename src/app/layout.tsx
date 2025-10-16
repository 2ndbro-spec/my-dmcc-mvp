import "./globals.css";
import Layout from "@/components/Layout";

export const metadata = {
  title: "DMCC Dashboard",
  description: "SEO/MEO診断と改善提案を自動で行うDMCCシステム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}