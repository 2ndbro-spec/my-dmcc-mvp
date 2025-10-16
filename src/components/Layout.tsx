"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "My Page", path: "/mypage" },
  { name: "Reports", path: "/reports" },
  { name: "Settings", path: "/settings" },
  { name: "Help", path: "/help" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } fixed z-40 top-0 left-0 h-full w-56 bg-white dark:bg-gray-800 shadow-lg transform transition-transform md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">DMCC</h2>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu size={22} />
          </button>
          <h1 className="font-semibold text-lg">DMCC Dashboard</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Ver.1.0</span>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}