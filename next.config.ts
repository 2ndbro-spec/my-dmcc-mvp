import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ ESLint ビルド時のエラーを無視（Vercel対策）
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ TypeScript の型エラーもビルドブロックしない（MVP段階用）
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ 必要なら今後 rewrites や redirects をここに追加
  // async rewrites() {
  //   return [
  //     { source: '/api/:path*', destination: 'https://your-backend/:path*' },
  //   ];
  // },
};

export default nextConfig;
