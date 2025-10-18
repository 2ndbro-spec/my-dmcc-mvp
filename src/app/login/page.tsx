// src/app/login/page.tsx
"use client";
import { signIn } from "next-auth/react";

export default function Login() {
  return (
    <div className="min-h-[80vh] grid place-items-center bg-gray-50">
      <div className="border rounded-xl p-8 bg-white shadow-sm w-[360px] grid gap-4">
        <h1 className="text-xl font-semibold text-center">DMCC Sign in</h1>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full border rounded px-4 py-2 hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        <p className="text-xs text-gray-500 text-center">
          By continuing you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}