// src/config/routes.ts
export const PATHS = {
  dashboard: "/dashboard",
  mypage: "/mypage",        // 🆕 追加
  reports: "/reports",
  settings: "/settings",
  help: "/help",            // 🆕 追加
  admin: "/admin",
  login: "/login",
  register: "/register",
};

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/reports",
  "/settings",
  "/admin",
];