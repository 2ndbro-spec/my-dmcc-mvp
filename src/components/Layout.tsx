"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { PATHS } from "@/config/routes"; // 必要に応じてルーティング定義
import {
  LayoutDashboard,
  User,
  BarChart2,
  Settings,
  HelpCircle,
} from "lucide-react";

const navItems = [
  { name: "ダッシュボード", path: PATHS.dashboard, icon: <LayoutDashboard /> },
  { name: "マイページ", path: PATHS.mypage, icon: <User /> },
  { name: "診断レポート", path: PATHS.reports, icon: <BarChart2 /> },
  { name: "設定", path: PATHS.settings, icon: <Settings /> },
  { name: "ヘルプ", path: PATHS.help, icon: <HelpCircle /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [openMobile, setOpenMobile] = useState(false);      // スマホ用
  const [collapsed, setCollapsed] = useState(false);        // デスクトップ折りたたみ用
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      
      {/* サイドバー */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full bg-white shadow-md
          transition-all duration-300 ease-in-out
          ${openMobile ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
          ${collapsed ? "w-16" : "w-56"}
        `}
      >
        {/* サイドバー上部 */}
        <div
            className={`
                px-4 py-3
                ${collapsed
                ? "flex flex-col items-center space-y-3"
                : "flex items-center justify-between"}
                 border-transparent
            `}
        >
            {collapsed ? (
                <button onClick={() => setCollapsed(false)} title="展開">
                <Menu size={28} />
                </button>
            ) : (
                <>
                <h2 className="font-bold text-lg">DMCC</h2>
                <button onClick={() => setCollapsed(true)} title="折りたたみ">
                    <Menu size={24} />
                </button>
                </>
            )}
        </div>

        {/* メニュー項目 */}
        <nav className="px-2 pt-4 space-y-2">
        {navItems.map((item) => {
            const isActive = pathname === item.path;

            return (
            <Link
                key={item.path}
                href={item.path}
                className={`
                flex items-center
                ${collapsed ? "justify-center p-3" : "gap-3 px-3 py-2"}
                rounded-md text-sm font-medium transition
                ${isActive ? "text-blue-600" : "text-gray-700 hover:text-blue-500"}
                `}
            >
                <span className="text-2xl">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
            );
        })}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <div className={`flex-1 flex flex-col ${collapsed ? "md:ml-16" : "md:ml-56"}`}>
        
        {/* ヘッダー */}
        <header className="h-14 flex items-center justify-between px-4 bg-white shadow-sm">
          <button className="md:hidden" onClick={() => setOpenMobile(!openMobile)}>
            <Menu size={22} />
          </button>
          <h1 className="font-semibold text-lg">DMCC Dashboard</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60">Ver.1.0</span>
          </div>
        </header>

        {/* 子ページ */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}