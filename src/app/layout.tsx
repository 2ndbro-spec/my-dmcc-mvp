import "./globals.css";
import Layout from "@/components/Layout";
import { Providers } from "./providers";

export const metadata = {
  title: "DMCC Dashboard",
  description: "SEO/MEO診断と改善提案を自動で行うDMCCシステム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}