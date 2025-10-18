// src/app/api/notify/test/route.ts
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function POST() {
  try {
    const res = await sendMail({
      subject: "[DMCC] 通知テスト",
      html: "<p>DMCC notify test</p>",
      text: "DMCC notify test",
    });
    return NextResponse.json({ ok: true, res });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), stack: String(e?.stack || "") },
      { status: 500 }
    );
  }
}